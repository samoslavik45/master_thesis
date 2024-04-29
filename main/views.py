from django.shortcuts import render
from django.http import HttpResponse
from django.http import JsonResponse, Http404
from rest_framework import status
from rest_framework.decorators import api_view
from rest_framework.response import Response
from django.contrib.auth import authenticate, login
from .models import CustomUser, Article, ArticleLike, Group, Author
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
from .models import Category, Tag, Keyword, GroupArticleLike, GroupInvite, UserArticleTag, ArticleMetadata
from .serializers import CategorySerializer, TagSerializer, KeywordSerializer, GroupSerializer, GroupInviteSerializer
import string
import random
import fitz  # PyMuPDF
import re
import sys
from rest_framework.parsers import MultiPartParser, FormParser
from rest_framework.decorators import parser_classes
from django.shortcuts import get_object_or_404
from django.db import transaction
from django.db import IntegrityError


User = get_user_model()

def say_hello(request):
    x = calculate()
    y = 2
    return render(request, 'hello.html', {'name': 'Ahoj'})

def calculate():
    x = 1
    y = 2
    return x

def simple_api(request):
    data = {'message': 'Hello from Django!'}
    return JsonResponse(data)

@api_view(['POST'])
def login_view(request):
    username = request.data.get('username')
    password = request.data.get('password')
    user = authenticate(request, username=username, password=password)
    if user is not None:
        login(request, user)
        refresh = RefreshToken.for_user(user)  # Vytvoriť tokeny pre používateľa
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
            "id": user.id,  # Pridanie ID používateľa do odpovede
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
    
    # Tu môžete pridať validáciu

    user = User.objects.create_user(username, email, password, first_name=first_name, last_name=last_name)
    return Response({'detail': 'Registrácia úspešná.'})

from django.db.models import Q

@api_view(['GET'])
def search_articles(request):
    query = request.query_params.get('q', '')

    # Základné filtrovanie článkov podľa všeobecných kritérií vyhľadávania
    base_query = (
        Q(title__icontains=query) |
        Q(authors__name__icontains=query) |  # Zmena z author_name na authors__name
        Q(keywords__keyword__icontains=query) |
        Q(userarticletag__tag__name__icontains=query, userarticletag__is_public=True)
    )

    # Ak je užívateľ prihlásený, pridaj filtrovanie pre jeho privátne tagy
    if request.user.is_authenticated:
        private_tags_query = Q(userarticletag__tag__name__icontains=query, userarticletag__user=request.user, userarticletag__is_public=False)
        articles_query = Article.objects.filter(base_query | private_tags_query)
    else:
        articles_query = Article.objects.filter(base_query)

    articles = articles_query.distinct().values(
        'id', 'title', 'content', 'pdf_file', 'created_at'
    )

    articles_list = list(articles)
    for article in articles_list:
        keywords = Keyword.objects.filter(articles__id=article['id']).values_list('keyword', flat=True)
        article['keywords'] = list(keywords)
        tags = Tag.objects.filter(userarticletag__article__id=article['id']).values_list('name', flat=True)
        article['tags'] = list(tags)
        categories = Category.objects.filter(articles__id=article['id']).values_list('name', flat=True)
        article['categories'] = list(categories)
        article['authors'] = list(Article.objects.get(id=article['id']).authors.values_list('name', flat=True))


    return Response({"articles": articles_list})



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

        authors = format_authors(metadata.authors.all())  # Získanie všetkých autorov

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
        article = Article.objects.get(id=article_id, added_by=request.user)
        article.delete()
        return JsonResponse({'message': 'Článek byl úspěšně smazán.'}, status=200)
    except Article.DoesNotExist:
        return JsonResponse({'error': 'Článek nebyl nalezen.'}, status=404)
    
@api_view(['GET'])
def user_articles(request):
    user = request.user
    articles = Article.objects.filter(added_by=user)
    serializer = ArticleSerializer(articles, many=True)
    return JsonResponse(serializer.data, safe=False)

from rest_framework.decorators import api_view
from .serializers import ArticleSerializer

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

    # Získať PDF súbor a načítať ho
    pdf_file = request.FILES.get('pdf_file')
    if not pdf_file:
        return Response({'error': 'No PDF file provided.'}, status=400)
    
    file_name, file_extension = os.path.splitext(pdf_file.name)
    if file_extension.lower() != '.pdf':
        return Response({'error': 'Invalid file type. Only PDF files are allowed.'}, status=status.HTTP_400_BAD_REQUEST)
    
    # Načítať metadata z PDF
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
            # Porovnáme metadáta
            existing_metadata = ArticleMetadata.objects.get(article=article)
            print(existing_metadata)
            print("existing_metadata.title:", existing_metadata.title)
            print("metadata.get('title', ''):", metadata.get('title', ''))
            print("existing_metadata.author:", existing_metadata.author)
            print("metadata.get('author_name', '')", metadata.get('author_name', ''))
            if existing_metadata and (existing_metadata.title == metadata.get('title', '') or existing_metadata.author == metadata.get('author', '')):
                return Response({'error': 'This PDF file already exists in the system.'}, status=status.HTTP_400_BAD_REQUEST)

    # Extrahovať hodnoty z metadát, ak nie sú poskytnuté v požiadavke
    title = request.data.get('title', metadata.get('title', ''))
    authors_names = request.data.getlist('authors')  # Dostanete zoznam mien autorov
    author = request.data.get('author_name', metadata.get('author', ''))
    subject = metadata.get('subject', None)
    creator = metadata.get('creator', None)
    doi = metadata.get('doi', None)
    keywords = request.data.get('keywords_text', '')
    keywords_list = [keyword.strip() for keyword in keywords.split(',') if keyword.strip()]

    # Vytvoriť článok pomocou poskytnutých údajov
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
                metadata_instance.authors.add(author)  # Pridať autora k metadátam


            # Pridať alebo vytvoriť kľúčové slová a asociovat ich s článkom
            for keyword_str in keywords_list:
                new_keyword = Keyword.objects.create(keyword=keyword_str)
                article.keywords.add(new_keyword)

            return Response(serializer.data, status=status.HTTP_201_CREATED)
    else:
        print(serializer.errors)  # Pomocné pre ladenie
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
        articles = Article.objects.all()  # Získanie všetkých článkov
        serializer = ArticleSerializer(articles, many=True)  # Serializácia článkov
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

    full_text = ""
    for page in doc:
        full_text += page.get_text()

    abstract_patterns = [
        r"(?si)\babstract\b\s*(.*?)(?:\n\s*\b(?:Introduction|Background|Methods|Results|Discussion|Conclusions|Keywords)\b|$)",
        r"(?si)\babstract\b\s*(.*?)(?=\n\s*\b(?:1\.|2\.|3\.|Introduction|Background|Methods|Results|Discussion|Conclusions|Keywords)\b)"
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
        print("Užívateľ už tento článok likol")
        return Response({'detail': 'Užívateľ už tento článok likol.'}, status=status.HTTP_409_CONFLICT)

    ArticleLike.objects.create(user=user, article=article)
    return Response({'detail': 'Článok bol úspešne liknutý.'}, status=status.HTTP_201_CREATED)

@api_view(['GET'])
@permission_classes([IsAuthenticated])
def liked_articles(request):
    user = request.user
    liked_articles = ArticleLike.objects.filter(user=user).select_related('article').all()
    # Serializujeme články, ktoré používateľ likol
    serializer = ArticleSerializer([like.article for like in liked_articles], many=True, context={'request': request})
    return Response(serializer.data)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def unlike_article(request, article_id):
    user = request.user
    try:
        like = ArticleLike.objects.get(article_id=article_id, user=user)
        like.delete()
        return Response({'message': 'Článek byl odstraněn z oblíbených.'}, status=status.HTTP_204_NO_CONTENT)
    except ArticleLike.DoesNotExist:
        return Response({'error': 'Článek nebyl nalezen v oblíbených.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def list_groups(request):
    user = request.user
    groups = user.custom_groups.all()  # Použite správny názov vzťahu
    serializer = GroupSerializer(groups, many=True)
    return Response(serializer.data)

@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_group(request):
    serializer = GroupSerializer(data=request.data)
    if serializer.is_valid():
        group = serializer.save(admin=request.user)  # Pridajte používateľa ako admina skupiny
        group.members.add(request.user)  # Pridajte používateľa aj ako člena
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
    
    # Kontrola, či sa pozvaný užívateľ už nenachádza v skupine
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
    # Získanie pozvánok, kde invited_user je aktuálny užívateľ a pozvánka nebola ešte akceptovaná
    # Toto predpokladá, že neexistuje explicitné pole pre odmietnutie a že neakceptovaná pozvánka je stále "pending"
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
        invite.delete()  # Odstránenie pozvánky po prijatí
        return Response({'message': 'Pozvánka bola prijatá a používateľ bol pridaný do skupiny.'}, status=status.HTTP_200_OK)
    except GroupInvite.DoesNotExist:
        return Response({'error': 'Pozvánka nenájdená.'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def reject_invite(request, invite_id):
    try:
        invite = GroupInvite.objects.get(id=invite_id, invited_user=request.user)
        invite.delete()  # Odstránenie pozvánky po odmietnutí
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

    # Získajte všetky verejné tagy pre daný článok
    public_tags_query = Tag.objects.filter(
        userarticletag__article=article,
        userarticletag__is_public=True
    ).distinct()

    # Získajte všetky tagy pridané prihláseným používateľom pre daný článok (verejné aj súkromné)
    user_tags_query = Tag.objects.filter(
        userarticletag__article=article,
        userarticletag__user=request.user
    ).distinct()

    # Konvertujte querysety na zoznamy názvov tagov
    public_tags_list = list(public_tags_query.values_list('name', flat=True))
    user_tags_list = list(user_tags_query.values_list('name', flat=True))

    # Vráťte zoznamy tagov
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
    # Get the group and article instances
    try:
        group = Group.objects.get(pk=group_id, admin=request.user)
        article = Article.objects.get(pk=article_id)
    except (Group.DoesNotExist, Article.DoesNotExist) as e:
        return Response({'detail': str(e)}, status=status.HTTP_404_NOT_FOUND)

    # Check if the article is liked by the group
    try:
        group_article_like = GroupArticleLike.objects.get(group=group, article=article)
    except GroupArticleLike.DoesNotExist:
        return Response({'detail': 'Article not liked by group.'}, status=status.HTTP_404_NOT_FOUND)

    # If the article is liked by the group, unlike it
    group_article_like.delete()
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
    # Odstránenie všetkých nevybavených pozvánok tohto člena do skupiny
    GroupInvite.objects.filter(group=group, invited_user=member).delete()
    return Response({'detail': 'Member successfully kicked out of the group.'}, status=status.HTTP_204_NO_CONTENT)

@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def delete_group(request, group_id):
    # Získajte skupinu na základe ID
    group = get_object_or_404(Group, id=group_id)

    # Overte, či je prihlásený používateľ administrátorom skupiny
    if group.admin != request.user:
        return Response({'detail': 'Unauthorized. Only group admin can delete the group.'}, status=status.HTTP_403_FORBIDDEN)

    # Vymažte skupinu
    group.delete()

    return Response({'detail': 'Group successfully deleted.'}, status=status.HTTP_200_OK)

@api_view(['PUT'])
@permission_classes([IsAuthenticated])
def update_article(request, article_id):
    # Získanie článku podľa ID
    article = get_object_or_404(Article, pk=article_id)

    # Skontrolujte, či má užívateľ oprávnenie na editáciu článku
    if article.added_by != request.user:
        return Response({"detail": "Nemáte oprávnenie upravovať tento článok."}, status=403)

    # Aktualizácia článku pomocou sérializátora
    serializer = ArticleSerializer(article, data=request.data, partial=True) # `partial=True` umožňuje čiastočnú aktualizáciu
    if serializer.is_valid():
        updated_article = serializer.save()

        print(request.data)
        author_names = request.data.get('authors', [])
        author_instances = []
        for name in author_names:
            author, created = Author.objects.get_or_create(name=name.strip())  # Zabezpečí, aby boli vedľajšie medzery odstránené
            author_instances.append(author)

        if hasattr(updated_article, 'metadata'):
            metadata = updated_article.metadata
            metadata.authors.set(author_instances)  # Nastavenie nových autorov
            metadata.save()
        else:
            metadata = ArticleMetadata.objects.create(article=updated_article)
            metadata.authors.set(author_instances)  # Nastavenie nových autorov
            metadata.save()


        keywords_ids = request.data.get('keywords', [])
        keywords_objects = Keyword.objects.filter(id__in=keywords_ids)
        keywords_str = ', '.join([kw.keyword for kw in keywords_objects])  # Spojí kľúčové slová do jedného reťazca

        metadata_data = {
            'title': request.data.get('title'),
            'subject': request.data.get('subject'),
            'creationDate': request.data.get('creationDate'),
            'keywords': keywords_str,
            'creator': request.data.get('creator'),
            'doi': request.data.get('doi'),
        }


        metadata_data = {key: value for key, value in metadata_data.items() if value is not None}


        if hasattr(updated_article, 'metadata'):
            # Aktualizuje existujúce metadáta
            ArticleMetadata.objects.filter(article=updated_article).update(**metadata_data)
        else:
            # Vytvorí nové metadáta, ak ešte nie sú priradené
            ArticleMetadata.objects.create(article=updated_article, **metadata_data)

        return Response(serializer.data)
    if not serializer.is_valid():
        print(serializer.errors)  # Toto vám ukáže, kde je problém
        return Response(serializer.errors, status=400)

    
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

    
@api_view(['POST'])
@permission_classes([IsAuthenticated])
def create_keyword(request):
    print("Received data:", request.data)  # Pridajte toto logovanie
    serializer = KeywordSerializer(data=request.data)
    if serializer.is_valid():
        keyword = serializer.save()
        return Response({'id': keyword.id, 'keyword': keyword.keyword}, status=201)
    return Response(serializer.errors, status=400)


@api_view(['DELETE'])
@permission_classes([IsAuthenticated])
def leave_group(request, group_id):
    try:
        group = Group.objects.get(id=group_id)
        # Overenie, či je užívateľ členom skupiny
        if request.user not in group.members.all():
            return JsonResponse({'message': 'You are not a member of this group.'}, status=403)

        # Odstránenie užívateľa zo skupiny
        group.members.remove(request.user)
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
            authors = format_authors(metadata.authors.all())  # Získanie všetkých autorov

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
