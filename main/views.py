from enum import member
from linecache import cache

from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from urllib3 import request
from .models import CustomUser, Article, ArticleLike, Group, Author, UserInteraction
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from django.contrib.auth.models import User
from django.db.models import Q
from django.conf import settings
import os
from django.contrib.auth import get_user_model
from django.views.decorators.http import require_POST
from django.contrib.auth.decorators import login_required
from .serializers import ArticleSerializer
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import permission_classes
from .models import Category, Tag, Keyword, GroupArticleLike, GroupInvite, UserArticleTag, ArticleMetadata, ArticleEmbedding
from .serializers import CategorySerializer, TagSerializer, KeywordSerializer, GroupSerializer, GroupInviteSerializer
import string
import random
import fitz  # PyMuPDF
import re
import sys
import numpy as np
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import IntegrityError
from main.recommender.similarity import cosine_similarity
from .models import RecommendationCache
from main.recommender.personalize import refresh_user_recommendations
from main.recommender.personalize import build_user_profile_debug
from main.recommender.index import update_single_article_sbert_embedding


User = get_user_model()

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        refresh = RefreshToken.for_user(user)
        return Response({
            'refresh': str(refresh),
            'access': str(refresh.access_token),
            "detail": "Prihlásenie úspešné."
        }, status=status.HTTP_200_OK)
    else:
        return Response({"detail": "Nesprávne prihlasovacie údaje."}, status=status.HTTP_401_UNAUTHORIZED)


class CurrentUserView(APIView):
    permission_classes = [IsAuthenticated]
    def get(self, request):
        user = request.user
        return Response({
            "id": user.id, 
            "first_name": user.first_name,
            "last_name": user.last_name,
            "email": user.email
        }, status=status.HTTP_200_OK)


@api_view(['POST'])
def register_user(request):
    username = request.data.get('username')
    password = request.data.get('password')
    email = request.data.get('email')
    first_name = request.data.get('first_name')
    last_name = request.data.get('last_name')
    

    user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
    return Response({'detail': 'Registrácia úspešná.'})

from django.db.models import Q

@api_view(['GET'])
def search_articles(request):
    query = request.query_params.get('q', '').strip()

    # Search conditions
    base_query = (
        Q(title__icontains=query) |
        Q(authors__name__icontains=query) |
        Q(keywords__keyword__icontains=query) |
        Q(userarticletag__tag__name__icontains=query, userarticletag__is_public=True)
    )

    if request.user.is_authenticated:
        private_tags_query = Q(
            userarticletag__tag__name__icontains=query,
            userarticletag__user=request.user,
            userarticletag__is_public=False
        )
        articles_qs = Article.objects.filter(base_query | private_tags_query)
    else:
        articles_qs = Article.objects.filter(base_query)

    # Prefetch relations
    articles = (
        articles_qs
        .distinct()
        .prefetch_related("categories", "keywords", "authors")
    )

    # preload category objects for speed
    categories_map = {
        c.id: {"id": c.id, "name": c.name, "description": c.description}
        for c in Category.objects.all()
    }

    results = []
    for article in articles:

        # FIX: extract safe file path
        file_path = article.pdf_file.name if article.pdf_file else ""

        # remove leading "media/" to match your frontend expectations
        if file_path.startswith("media/"):
            file_path = file_path.replace("media/", "", 1)

        results.append({
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "pdf_file": file_path,
            "created_at": article.created_at,

            # authors (strings)
            "authors": list(article.authors.values_list("name", flat=True)),

            # keywords (strings)
            "keywords": [kw.keyword for kw in article.keywords.all()],

            # tags
            "tags": list(
                Tag.objects.filter(userarticletag__article=article)
                .values_list("name", flat=True)
            ),

            # categories (OBJECTS!)
            "categories": [
                categories_map[c.id]
                for c in article.categories.all()
                if c.id in categories_map
            ],
        })

    return Response({"articles": results})



@api_view(['GET'])
def download_pdf(request, filename):
    path_to_file = os.path.join(settings.MEDIA_ROOT, filename)
    
    if os.path.exists(path_to_file):
        with open(path_to_file, 'rb') as pdf_file:
            response = HttpResponse(pdf_file.read(), content_type='application/pdf')
            response['Content-Disposition'] = f'attachment; filename="{filename}"'
            return response
    else:
        raise Http404("Soubor nenalezen")
    
def format_authors(authors_queryset):
    authors = list(authors_queryset)
    return ' and '.join([f"{author.name.split(' ')[-1]}, " + ', '.join(author.name.split(' ')[:-1]) for author in authors])


@api_view(['POST'])
def generate_bibtex(request):
    filename = request.data.get('filename')
    try:
        article = Article.objects.get(pdf_file=filename)
        metadata = ArticleMetadata.objects.get(article=article)

        authors = format_authors(metadata.authors.all()) 

        bibtex_template = f"""
        @article{{{metadata.article.id},
            author = "{{{authors}}}",
            title = "{{{metadata.title}}}",
            year = "{{{metadata.creationDate if metadata.creationDate else 'Unknown Year'}}}",
            journal = "{{Unknown Journal}}",
            keywords = "{{{metadata.keywords}}}",
            doi = "{{{metadata.doi}}}"
        }}
        """
        return HttpResponse(bibtex_template, content_type="text/plain")
    except Article.DoesNotExist:
        return HttpResponse("Article not found.", status=404)
    except ArticleMetadata.DoesNotExist:
        return HttpResponse("Metadata not found.", status=404)
    
@csrf_exempt
@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_article(request, article_id):
    try:
        # 1️⃣ Nájdeme článok len ak patrí aktuálnemu používateľovi
        article = Article.objects.get(id=article_id, added_by=request.user)

        # 2️⃣ Ak existuje PDF, vymažeme ho zo systému
        if article.pdf_file:
            pdf_path = os.path.join(settings.MEDIA_ROOT, article.pdf_file.name)
            if os.path.exists(pdf_path):
                os.remove(pdf_path)

        # 3️⃣ Uchováme si jeho keywords a authors pre neskoršiu kontrolu
        keywords_to_check = list(article.keywords.all())
        authors_to_check = list(article.authors.all())

        # (ak máš aj UserArticleTag alebo GroupArticleLike, tie sa automaticky vymažú cez FK CASCADE)

        # 4️⃣ Vymažeme samotný článok
        article.delete()

        # 5️⃣ Skontrolujeme, ktoré keywords/autori už nikde nie sú použité
        for kw in keywords_to_check:

            # všetky keywordy s rovnakým menom (case-insensitive)
            dupes = Keyword.objects.filter(keyword__iexact=kw.keyword)

            # ak hociktorý z týchto keyword objektov je ešte použitý → NEZMAZAŤ
            still_used = False
            for d in dupes:
                if d.articles.exists():
                    still_used = True
                    break

            # ak žiadny nie je použitý → zmaž všetky duplicity
            if not still_used:
                dupes.delete()


        for author in authors_to_check:
            if not author.authored_articles.exists():
                author.delete()

        # 6️⃣ Tagy — ak už nie sú nikde v UserArticleTag, tiež zmažeme
        from main.models import Tag
        for tag in Tag.objects.all():
            if not tag.userarticletag_set.exists():
                tag.delete()
        
        refresh_recommendations_for_all_models(request.user, limit=8)

        return JsonResponse({'message': 'Článok a všetky nepoužívané väzby boli úspešne zmazané.'}, status=200)

    except Article.DoesNotExist:
        return JsonResponse({'error': 'Článok nebol nájdený alebo nepatrí prihlásenému používateľovi.'}, status=404)

    except Exception as e:
        return JsonResponse({'error': f'Chyba pri mazaní článku alebo väzieb: {str(e)}'}, status=500)

    
@api_view(['GET'])
def user_articles(request):
    user = request.user
    articles = (
        Article.objects
        .filter(added_by=user)
        .prefetch_related("categories", "keywords", "authors")
    )

    # preload category objects
    categories_map = {
        c.id: {"id": c.id, "name": c.name, "description": c.description}
        for c in Category.objects.all()
    }

    results = []
    for article in articles:

        # pdf path fix
        file_path = article.pdf_file.name if article.pdf_file else ""
        if file_path.startswith("media/"):
            file_path = file_path.replace("media/", "", 1)

        results.append({
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "pdf_file": file_path,
            "created_at": article.created_at,

            # authors (string[])
            "authors": list(article.authors.values_list("name", flat=True)),

            # keywords (string[])
            "keywords": [kw.keyword for kw in article.keywords.all()],

            # categories (object[])
            "categories": [
                categories_map[c.id]
                for c in article.categories.all()
                if c.id in categories_map
            ],

            # you also have tags in profile, so add them
            "tags": list(
                Tag.objects.filter(userarticletag__article=article)
                .values_list("name", flat=True)
            ),
        })

    return Response(results)


def generate_unique_tag():
    while True:
        tag = ''.join(random.choices(string.ascii_uppercase + string.digits, k=4))
        if not Tag.objects.filter(name=tag).exists():
            tag = '#' + tag
            return tag


def extract_year_from_creation_date(creation_date):
    match = re.match(r'D:(\d{4})', creation_date)
    return match.group(1) if match else None

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
@permission_classes([IsAuthenticated])
def create_article(request):
    print("Received data:", request.data)

    pdf_file = request.FILES.get('pdf_file')
    if not pdf_file:
        return Response({'error': 'No PDF file provided .'}, status=400)
    
    file_name, file_extension = os.path.splitext(pdf_file.name)
    if file_extension.lower() != '.pdf':
        return Response({'error': 'Invalid file type. Only PDF files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    metadata = doc.metadata
    print(metadata)

    creation_date = metadata.get('creationDate')
    extracted_year = extract_year_from_creation_date(creation_date) if creation_date else None


    existing_articles = Article.objects.all()
    print(existing_articles)
    for article in existing_articles:
        print(article)
        print("toto je article.pdf_file:", article.pdf_file)
        print("toto je os.path.basename", os.path.basename(article.pdf_file.name))
        print("pdf_file.name", pdf_file.name)
        if article.pdf_file and os.path.basename(article.pdf_file.name) == pdf_file.name:
            print("som tu")
            existing_metadata = ArticleMetadata.objects.get(article=article)
            print(existing_metadata)
            print("existing_metadata.title:", existing_metadata.title)
            print("metadata.get('title', ''):", metadata.get('title', ''))
            print("existing_metadata.author:", existing_metadata.authors)
            print("metadata.get('author_name', '')", metadata.get('author_name', ''))
            if existing_metadata and (existing_metadata.title == metadata.get('title', '') or existing_metadata.authors == metadata.get('author', '')):
                return Response({'error': 'This PDF file already exists in the system.'}, status=status.HTTP_400_BAD_REQUEST)

    title = request.data.get('title', metadata.get('title', ''))
    authors_names = request.data.getlist('authors')  
    author = request.data.get('author_name', metadata.get('author', ''))
    subject = metadata.get('subject', None)
    creator = metadata.get('creator', None)
    doi = metadata.get('doi', None)
    keywords = request.data.get('keywords_text', '')
    keywords_list = [keyword.strip() for keyword in keywords.split(',') if keyword.strip()]

    serializer = ArticleSerializer(data=request.data, context={'request': request})
    if serializer.is_valid():
        with transaction.atomic():
            article = serializer.save(added_by=request.user)
            metadata_instance = ArticleMetadata.objects.create(
                article=article,
                title=title,
                subject=subject,
                creator=creator,
                creationDate=extracted_year,
                keywords=keywords_list,
                doi=doi
            )
            for name in authors_names:
                author, created = Author.objects.get_or_create(name=name)
                article.authors.add(author)
                metadata_instance.authors.add(author)  

            for keyword_str in keywords_list:
                keyword_clean = keyword_str.lower().strip()
                keyword_obj, created = Keyword.objects.get_or_create(keyword=keyword_clean)
                article.keywords.add(keyword_obj)
            
            update_single_article_sbert_embedding(article)
            refresh_recommendations_for_all_models(request.user, limit=8)
            
            return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        print(serializer.errors) 
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
def get_tags(request):
    tags = Tag.objects.all()
    serializer = TagSerializer(tags, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def get_keywords(request):
    keywords = Keyword.objects.all()
    serializer = KeywordSerializer(keywords, many=True)
    return Response(serializer.data)

@api_view(['GET'])
def all_articles(request):
    if request.method == 'GET':
        articles = Article.objects.all() 
        serializer = ArticleSerializer(articles, many=True)  
        return Response(serializer.data, status=status.HTTP_200_OK)
    
from rest_framework.decorators import api_view, parser_classes
from rest_framework.parsers import MultiPartParser, FormParser
from django.http import JsonResponse
import fitz  # PyMuPDF
import re

@api_view(['POST'])
@parser_classes([MultiPartParser, FormParser])
def extract_keywords_from_pdf(request):
    if 'pdf_file' not in request.FILES:
        return JsonResponse({'error': 'No PDF file provided.'}, status=400)
    
    pdf_file = request.FILES['pdf_file']
    doc = fitz.open(stream=pdf_file.read(), filetype="pdf")
    metadata = doc.metadata
    print(metadata)
    title = metadata.get('title', '')
    author = metadata.get('author', '')
    metadata_keywords = doc.metadata.get('keywords', '')

    if len(doc) > 0:  
        first_page_text = doc[0].get_text()  
        print("First page text:", first_page_text)

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    abstract_patterns = [
        r"(?si)\babstract\b\s*(.*?)(?:\n\s*(?:\d+\.\s*)?(?:Introduction|Background|Methods|Results|Discussion|Conclusions|Keywords)|\n{2,})",
        r"(?si)\babstract\b\s*([^\n]+(?:\n(?!\n)[^\n]+)*)" 
        #r"(?si)\babstract\b\s*(.*?)(?:\n\s*\b(?:Introduction|Background|Methods|Results|Discussion|Conclusions|Keywords)\b|$)",
        #r"(?si)\babstract\b\s*(.*?)(?=\n\s*\b(?:1\.|2\.|3\.|Introduction|Background|Methods|Results|Discussion|Conclusions|Keywords)\b)"
    ]


    abstract = ""
    for pattern in abstract_patterns:
        abstract_match = re.search(pattern, full_text, re.DOTALL)
        if abstract_match:
            abstract = abstract_match.group(1).strip()
            break

    if metadata_keywords:
        keywords_list = [keyword.strip() for keyword in metadata_keywords.split(',') if keyword.strip()]
        return JsonResponse({'title': title, 'author': author, 'abstract': abstract, 'keywords': keywords_list})

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    regex_patterns = [
        r"Keywords\s*:\s*([\s\S]*?)(?:\.|References)",
        r"Keywords\s(.*)",
        r"(?<=\n)([a-zA-Z\s,]+)(?=\nKEYWORDS)"
    ]

    matches = []
    for pattern in regex_patterns:
        match = re.findall(pattern, full_text, re.IGNORECASE)
        if match:
            matches.extend(match)

    cleaned_matches = []
    for match in matches:
        keywords = [keyword.strip() for keyword in match.split(',') if keyword.strip()]
        cleaned_matches.extend(keywords)
    return JsonResponse({'title': title, 'author': author, 'abstract': abstract, 'keywords': cleaned_matches if cleaned_matches else []})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_article(request, article_id):
    user = request.user
    article = get_object_or_404(Article, id=article_id)

    if ArticleLike.objects.filter(user=user, article=article).exists():
        return Response({'detail': 'Užívateľ už tento článok likol.'}, status=status.HTTP_409_CONFLICT)

    ArticleLike.objects.create(user=user, article=article)

    refresh_recommendations_for_all_models(user, limit=8)

    return Response({'detail': 'Článok bol úspešne liknutý.'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liked_articles(request):
    user = request.user

    # get liked article objects
    liked = (
        ArticleLike.objects
        .filter(user=user)
        .select_related('article')
    )

    articles = (
        Article.objects
        .filter(id__in=[l.article.id for l in liked])
        .prefetch_related("categories", "keywords", "authors")
    )

    # preload category metadata
    categories_map = {
        c.id: {"id": c.id, "name": c.name, "description": c.description}
        for c in Category.objects.all()
    }

    results = []

    for article in articles:

        # file path
        file_path = article.pdf_file.name if article.pdf_file else ""
        if file_path.startswith("media/"):
            file_path = file_path.replace("media/", "", 1)

        results.append({
            "id": article.id,
            "title": article.title,
            "content": article.content,
            "pdf_file": file_path,
            "created_at": article.created_at,

            # authors (strings)
            "authors": list(article.authors.values_list("name", flat=True)),

            # keywords (strings)
            "keywords": [kw.keyword for kw in article.keywords.all()],

            # categories (objects)
            "categories": [
                categories_map[c.id]
                for c in article.categories.all()
                if c.id in categories_map
            ],

            # liked articles also need tags (like profile shows)
            "tags": list(
                Tag.objects.filter(userarticletag__article=article)
                .values_list("name", flat=True)
            ),
        })

    return Response(results)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlike_article(request, article_id):
    user = request.user
    try:
        like = ArticleLike.objects.get(article_id=article_id, user=user)
        like.delete()

        refresh_recommendations_for_all_models(user, limit=8)

        return Response({'message': 'Článek byl odstraněn z oblíbených.'}, status=status.HTTP_204_NO_CONTENT)
    except ArticleLike.DoesNotExist:
        return Response({'error': 'Článek nebyl nalezen v oblíbených.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_groups(request):
    user = request.user
    groups = user.custom_groups.all()  
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework import status
from rest_framework.response import Response

from .models import Group  # alebo ako sa ti volá model
from .serializers import GroupSerializer


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    name = request.data.get("name", "").strip()

    # 1) kontrola duplicitného názvu (case-insensitive)
    if not name:
        return Response(
            {"name": ["Group name is required."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    if Group.objects.filter(name__iexact=name).exists():
        return Response(
            {"name": ["Group with this name already exists."]},
            status=status.HTTP_400_BAD_REQUEST,
        )

    # 2) pokračuj štandardne
    serializer = GroupSerializer(data={**request.data, "name": name})
    if serializer.is_valid():
        group = serializer.save(admin=request.user)
        group.members.add(request.user)
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_details(request, group_id):
    try:
        group = Group.objects.get(pk=group_id)
        serializer = GroupSerializer(group)
        return Response(serializer.data)
    except Group.DoesNotExist:
        return Response(status=404, data={'message': 'Skupina nenájdená.'})

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def group_liked_articles(request, group_id):
    try:
        group = Group.objects.get(pk=group_id)
        liked_articles_relations = GroupArticleLike.objects.filter(group=group)
        liked_articles = [relation.article for relation in liked_articles_relations]
        serializer = ArticleSerializer(liked_articles, many=True)
        return Response(serializer.data)
    except Group.DoesNotExist:
        return Response(status=404, data={'message': 'Skupina nenájdená.'})

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def like_article_as_group(request, group_id):
    try:
        group = get_object_or_404(Group, pk=group_id, members=request.user)
        article_id = request.data.get('article_id')
        article = get_object_or_404(Article, pk=article_id)

        if GroupArticleLike.objects.filter(group=group, article=article).exists():
            return Response({'message': 'Skupina už tento článok likovala.'}, status=status.HTTP_409_CONFLICT)

        GroupArticleLike.objects.create(group=group, article=article)

        refresh_recommendations_for_all_models(request.user, limit=8)

        return Response({'message': 'Článok bol úspešne liknutý skupinou.'}, status=status.HTTP_201_CREATED)

    except Group.DoesNotExist:
        return Response({'message': 'Skupina nenájdená alebo nemáte oprávnenie.'}, status=status.HTTP_403_FORBIDDEN)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def send_group_invite(request, group_id):
    username = request.data.get('username')
    if not username:
        return Response({'error': 'Username is required.'}, status=400)
    
    group = get_object_or_404(Group, id=group_id)
    if request.user != group.admin:
        return Response({'error': 'You are not authorized to send invites for this group.'}, status=403)
    
    try:
        invited_user = User.objects.get(username=username)
    except User.DoesNotExist:
        return Response({'error': 'User not found.'}, status=404)
    
    if invited_user in group.members.all():
        return Response({'error': 'User is already a member of the group.'}, status=400)
    
    if GroupInvite.objects.filter(group=group, invited_user=invited_user).exists():
        return Response({'error': 'Invite has already been sent to this user.'}, status=400)

    GroupInvite.objects.create(group=group, invited_user=invited_user, sender=request.user)
    return Response({'message': f'Invite sent to {username}.'})


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_invites(request):
    user = request.user
    invites = GroupInvite.objects.filter(invited_user=user, accepted=False)
    serializer = GroupInviteSerializer(invites, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def accept_invite(request, invite_id):
    try:
        invite = GroupInvite.objects.get(id=invite_id, invited_user=request.user)
        group = invite.group
        group.members.add(invite.invited_user)
        invite.delete()  
        return Response({'message': 'Pozvánka bola prijatá a používateľ bol pridaný do skupiny.'}, status=status.HTTP_200_OK)
    except GroupInvite.DoesNotExist:
        return Response({'error': 'Pozvánka nenájdená.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_invite(request, invite_id):
    try:
        invite = GroupInvite.objects.get(id=invite_id, invited_user=request.user)
        invite.delete() 
        return Response({'message': 'Pozvánka bola odmietnutá.'}, status=200)
    except GroupInvite.DoesNotExist:
        return Response({'error': 'Pozvánka nenájdená.'}, status=404)


    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def add_tag_to_article(request):
    article_id = request.data.get('article_id')
    tag_name = request.data.get('tag_name')
    is_public = request.data.get('is_public', True)

    article = get_object_or_404(Article, id=article_id)
    tag, _ = Tag.objects.get_or_create(name=tag_name)
    UserArticleTag.objects.create(user=request.user, article=article, tag=tag, is_public=is_public)

    return Response({'message': 'Tag bol úspešne pridaný k článku.'}, status=status.HTTP_201_CREATED)



@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_tags_for_article(request, article_id):
    article = get_object_or_404(Article, id=article_id)


    public_tags_query = Tag.objects.filter(
        userarticletag__article=article,
        userarticletag__is_public=True
    ).distinct()


    user_tags_query = Tag.objects.filter(
        userarticletag__article=article,
        userarticletag__user=request.user
    ).distinct()


    public_tags_list = list(public_tags_query.values_list('name', flat=True))
    user_tags_list = list(user_tags_query.values_list('name', flat=True))

    return JsonResponse({'publicTags': public_tags_list, 'userTags': user_tags_list})

@api_view(['GET'])
def get_publictags(request, article_id):
    article = get_object_or_404(Article, id=article_id)

    public_tags_query = Tag.objects.filter(
        userarticletag__article=article,
        userarticletag__is_public=True
    ).distinct()

    public_tags_list = list(public_tags_query.values_list('name', flat=True))

    return JsonResponse({'publicTags': public_tags_list})

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlike_article_as_group(request, group_id, article_id):
    try:
        group = Group.objects.get(pk=group_id, admin=request.user)
        article = Article.objects.get(pk=article_id)
    except (Group.DoesNotExist, Article.DoesNotExist) as e:
        return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)

    try:
        group_article_like = GroupArticleLike.objects.get(group=group, article=article)
    except GroupArticleLike.DoesNotExist:
        return Response({'detail': 'Article not liked by group.'}, status=status.HTTP_404_NOT_FOUND)

    group_article_like.delete()

    refresh_recommendations_for_all_models(request.user, limit=8)

    return Response({'detail': 'Article has been unliked by the group.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def kick_member(request, group_id, member_id):
    group = get_object_or_404(Group, id=group_id)
    if request.user != group.admin:
        return Response({'detail': 'Only the group admin can kick members out.'}, status=status.HTTP_403_FORBIDDEN)
    member = get_object_or_404(User, id=member_id)
    if member not in group.members.all():
        return Response({'detail': 'Member not part of the group.'}, status=status.HTTP_404_NOT_FOUND)
    
    group.members.remove(member)
    refresh_recommendations_for_all_models(member, limit=8)
    GroupInvite.objects.filter(group=group, invited_user=member).delete()
    return Response({'detail': 'Member successfully kicked out of the group.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_group(request, group_id):

    group = get_object_or_404(Group, id=group_id)


    if group.admin != request.user:
        return Response({'detail': 'Unauthorized. Only group admin can delete the group.'}, status=status.HTTP_403_FORBIDDEN)

    members = list(group.members.all())
    
    group.delete()
    
    for member in members:
        refresh_recommendations_for_all_models(member, limit=8)
    return Response({'detail': 'Group successfully deleted.'}, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_article(request, article_id):
    article = get_object_or_404(Article, pk=article_id)

    if article.added_by != request.user:
        return Response({"detail": "Nemáte oprávnenie upravovať tento článok."}, status=403)

    # hack – backend očakáva categories cez categories=[]
    if 'category_id' in request.data:
        request.data['categories'] = [request.data.pop('category_id')]

    # ULOŽ STARÉ KEYWORDY SKÔR, NEŽ SA NĚČO ZMENÍ
    old_keywords = list(article.keywords.all())

    serializer = ArticleSerializer(article, data=request.data, partial=True)
    if not serializer.is_valid():
        print(serializer.errors)
        return Response(serializer.errors, status=400)

    updated_article = serializer.save()   # 🔥 TU UŽ JE ARTICLE UPDATE FINÁLNY

    # -------------------------------------------------------
    # AUTHORS
    # -------------------------------------------------------
    author_names = request.data.get('authors', [])
    author_instances = []
    for name in author_names:
        cleaned = name.strip()
        if cleaned:
            author_obj, _ = Author.objects.get_or_create(name=cleaned)
            author_instances.append(author_obj)

    if hasattr(updated_article, "metadata"):
        metadata = updated_article.metadata
    else:
        metadata = ArticleMetadata.objects.create(article=updated_article)

    metadata.authors.set(author_instances)

    # -------------------------------------------------------
    # KEYWORDS – jednotná normalizácia + deduplikácia
    # -------------------------------------------------------
    keywords_text = request.data.get("keywords_text", "")

    if isinstance(keywords_text, list):
        keywords_text = ", ".join([str(x) for x in keywords_text])

    raw_keywords = [kw.strip() for kw in keywords_text.split(",") if kw.strip()]
    normalized_keywords = [kw.lower() for kw in raw_keywords]

    keyword_objs = []
    for kw_norm in normalized_keywords:
        existing = Keyword.objects.filter(keyword__iexact=kw_norm).first()
        if existing:
            keyword_objs.append(existing)
        else:
            new_kw = Keyword.objects.create(keyword=kw_norm)
            keyword_objs.append(new_kw)

    updated_article.keywords.set(keyword_objs)

    metadata.keywords = ", ".join(raw_keywords)

    # -------------------------------------------------------
    # REMOVE UNUSED KEYWORDS AFTER EDIT
    # -------------------------------------------------------

    # zistíme keywordy po update
    new_keywords = list(updated_article.keywords.all())

    # keywordy, ktoré boli na článku predtým, ale už nie sú
    removed_keywords = [kw for kw in old_keywords if kw not in new_keywords]

    for kw in removed_keywords:
        dupes = Keyword.objects.filter(keyword__iexact=kw.keyword)

        used_somewhere = any(d.articles.exists() for d in dupes)

        if not used_somewhere:
            dupes.delete()

    # -------------------------------------------------------
    # Zvyšné metadata polia
    # -------------------------------------------------------
    for field in ["title", "subject", "creationDate", "creator", "doi"]:
        if field in request.data:
            setattr(metadata, field, request.data[field])

    metadata.save()

    update_single_article_sbert_embedding(updated_article)
    refresh_recommendations_for_all_models(request.user, limit=8)

    return Response(serializer.data)




    
class CategoryList(APIView):
    def get(self, request, format=None):
        categories = Category.objects.all()
        serializer = CategorySerializer(categories, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    def post(self, request, format=None):
        serializer = CategorySerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
    
from django.conf import settings
    
class ArticlesByCategory(APIView):
    """
    Return articles by category.
    Ensures categories are returned as objects {id, name, description}
    and keywords as simple strings.
    """

    def get(self, request, category_id):

        # Fetch articles + prefetch related objects
        articles = (
            Article.objects
            .filter(categories__id=category_id)
            .prefetch_related('categories', 'keywords')
        )

        serialized = ArticleSerializer(articles, many=True).data

        # Preload category + keyword dictionaries (super fast)
        categories_map = {
            c.id: {"id": c.id, "name": c.name, "description": c.description}
            for c in Category.objects.all()
        }
        keywords_map = {
            k.id: k.keyword
            for k in Keyword.objects.all()
        }

        # Transform serialized result to correct frontend shape
        for article in serialized:

            # Remove "/media/" prefix
            if article["pdf_file"].startswith("/media/"):
                article["pdf_file"] = article["pdf_file"].replace("/media/", "", 1)

            # Replace category IDs -> category objects
            article["categories"] = [
                categories_map[cat_id] for cat_id in article["categories"]
                if cat_id in categories_map
            ]

            # Replace keyword IDs -> keyword string
            article["keywords"] = [
                keywords_map[kw_id] for kw_id in article["keywords"]
                if kw_id in keywords_map
            ]

        return Response(serialized, status=status.HTTP_200_OK)


    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_keyword(request):
    raw_kw = request.data.get('keyword', '')

    # 1) ošetri vstup
    cleaned = raw_kw.strip().lower()
    if not cleaned:
        return Response({'error': 'Keyword cannot be empty.'}, status=400)

    # 2) case-insensitive deduplikácia
    existing = Keyword.objects.filter(keyword__iexact=cleaned).first()
    if existing:
        kw_obj = existing
    else:
        kw_obj = Keyword.objects.create(keyword=cleaned)

    return Response(
        {'id': kw_obj.id, 'keyword': kw_obj.keyword},
        status=201
    )


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def leave_group(request, group_id):
    try:
        group = Group.objects.get(id=group_id)

        if request.user not in group.members.all():
            return JsonResponse({'message': 'You are not a member of this group.'}, status=403)


        group.members.remove(request.user)
        refresh_recommendations_for_all_models(request.user, limit=8)
        group.save()

        return JsonResponse({'message': 'You have successfully left the group.'}, status=200)
    except Group.DoesNotExist:
        return JsonResponse({'message': 'Group not found.'}, status=404)
    
@api_view(['GET'])
def export_bibtex(request, group_id):
    try:
        group = Group.objects.get(id=group_id)
        group_likes = GroupArticleLike.objects.filter(group=group)
        bibtex_entries = []

        for group_like in group_likes:
            article = group_like.article
            metadata = ArticleMetadata.objects.get(article=article)
            authors = format_authors(metadata.authors.all())  

            bibtex_entry = f"""
            @article{{{metadata.article.id},
                author = "{{{authors}}}",
                title = "{{{metadata.title}}}",
                year = "{{{metadata.creationDate if metadata.creationDate else 'Unknown Year'}}}",
                journal = "{{Unknown Journal}}",
                keywords = "{{{metadata.keywords}}}",
                doi = "{{{metadata.doi}}}"
            }}
            """
            bibtex_entries.append(bibtex_entry)

        return HttpResponse('\n'.join(bibtex_entries), content_type="text/plain")
    except Group.DoesNotExist:
        return HttpResponse("Group not found.", status=404)
    except ArticleMetadata.DoesNotExist:
        return HttpResponse("Metadata not found for one or more articles.", status=404)


@api_view(['GET'])
def similar_to_article(request, article_id):
    """
    Vráti najpodobnejšie články podľa zvoleného embedding modelu.
    Podporované napr.:
    - tfidf-v1
    - sbert-v1
    """
    k = int(request.query_params.get('k', 5))
    algo = request.query_params.get('algo', 'tfidf-v1')

    # 1. Nájdeme embedding aktuálneho článku pre zvolený model
    me = ArticleEmbedding.objects.filter(
        article_id=article_id,
        model_name=algo
    ).first()

    if not me:
        return Response([])  # článok ešte nemá embedding pre tento model

    me_vec = np.array(me.vector, dtype=float)

    # 2. Načítať embeddingy všetkých ostatných článkov pre rovnaký model
    candidates = ArticleEmbedding.objects.filter(
        model_name=algo
    ).exclude(
        article_id=article_id
    )

    scored = []

    for cand in candidates:
        v = np.array(cand.vector, dtype=float)
        sim = cosine_similarity(me_vec, v)
        scored.append((cand.article_id, sim))

    # 3. Zoradiť podľa similarity zostupne
    scored.sort(key=lambda x: x[1], reverse=True)

    # 4. Vybrať top k výsledkov
    top_ids = [aid for aid, sim in scored[:k]]

    # 5. Načítať články a serializovať
    articles = Article.objects.filter(id__in=top_ids)
    serialized = ArticleSerializer(
        articles,
        many=True,
        context={'request': request}
    ).data

    # zachovať pôvodné poradie
    id_to_data = {a['id']: a for a in serialized}
    ordered = [id_to_data[i] for i in top_ids if i in id_to_data]

    return Response(ordered)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations(request):
    user = request.user
    algo = request.query_params.get('algo', 'tfidf-v1')
    limit = int(request.query_params.get('limit', 8))

    cache = (
        RecommendationCache.objects
        .filter(user=user, algo=algo)
        .order_by('-created_at')
        .first()
    )

    if not cache or not cache.payload:
        refresh_recommendations_for_all_models(user, limit=limit)

        cache = (
            RecommendationCache.objects
            .filter(user=user, algo=algo)
            .order_by('-created_at')
            .first()
        )

    payload = cache.payload[:limit] if cache and cache.payload else []

    article_ids = [item['id'] for item in payload]
    if not article_ids:
        return Response([])

    articles = Article.objects.filter(id__in=article_ids)
    serialized = ArticleSerializer(
        articles,
        many=True,
        context={'request': request}
    ).data

    id_to_data = {article['id']: article for article in serialized}

    ordered = []
    for item in payload:
        article_data = id_to_data.get(item['id'])
        if article_data:
            article_data['score'] = item.get('score')
            ordered.append(article_data)

    return Response(ordered, status=status.HTTP_200_OK)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def recommendation_feedback(request, article_id):
    user = request.user
    action = request.data.get('action')
    algo = request.data.get('algo', 'tfidf-v1')

    if action not in ['like', 'dismiss']:
        return Response(
            {'detail': 'Invalid action. Use "like" or "dismiss".'},
            status=status.HTTP_400_BAD_REQUEST
        )

    article = get_object_or_404(Article, id=article_id)

    if action == 'like':
        UserInteraction.objects.create(
            user=user,
            article=article,
            kind=2
        )

        ArticleLike.objects.get_or_create(
            user=user,
            article=article
        )

    elif action == 'dismiss':
        UserInteraction.objects.create(
            user=user,
            article=article,
            kind=3
        )

    refresh_recommendations_for_all_models(user, limit=8)

    cache = (
        RecommendationCache.objects
        .filter(user=user, algo=algo)
        .order_by('-created_at')
        .first()
    )

    payload = cache.payload[:8] if cache and cache.payload else []

    return Response(
        {
            'detail': 'Feedback saved successfully.',
            'recommendations': payload
        },
        status=status.HTTP_200_OK
    )

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def get_recommendations_debug(request):
    user = request.user
    algo = request.query_params.get('algo', 'tfidf-v1')
    limit = int(request.query_params.get('limit', 8))

    debug_data = build_user_profile_debug(
        user=user,
        model_name=algo,
        limit=limit,
    )

    return Response(debug_data, status=status.HTTP_200_OK)


def refresh_recommendations_for_all_models(user, limit=8):
    refresh_user_recommendations(user, model_name='tfidf-v1', limit=limit)
    refresh_user_recommendations(user, model_name='sbert-v1', limit=limit)