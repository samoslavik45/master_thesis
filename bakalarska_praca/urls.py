"""
URL configuration for bakalarska_praca project.

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/5.0/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  path('', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  path('', Home.as_view(), name='home')
Including another URLconf
    1. Import the include() function: from django.urls import include, path
    2. Add a URL to urlpatterns:  path('blog/', include('blog.urls'))
"""
from django.contrib import admin
from django.urls import path, include
from main import views
from main.views import CurrentUserView
from django.conf import settings
from django.conf.urls.static import static

urlpatterns = [
    path('admin/', admin.site.urls),
    path('main/', include('main.urls')),
    path('api/login/', views.login_view, name='login'),
    path('api/register/', views.register_user, name='register'),
    path('main/current_user/', CurrentUserView.as_view(), name='current_user'),
    path('download/<str:filename>/', views.download_pdf, name='download_pdf'),
    path('api/articles/delete/<int:article_id>/', views.delete_article, name='delete_article'),
    path('api/user-articles/', views.user_articles, name='user_articles'),
    path('api/articles/create/', views.create_article, name='create_article'),
    path('api/tags/', views.get_tags, name='get_tags'),
    path('api/keywords/', views.get_keywords, name='get_keywords'),
    path('api/articles/', views.all_articles, name='all_articles'),
    path('extract-keywords/', views.extract_keywords_from_pdf, name='extract-keywords'),
    path('api/articles/like/<int:article_id>/', views.like_article, name='like-article'),
    path('api/liked-articles/', views.liked_articles, name='liked-articles'),
    path('api/articles/unlike/<int:article_id>/', views.unlike_article, name='unlike-article'),
    path('api/groups/', views.list_groups, name='list-groups'),
    path('api/groups/create/', views.create_group, name='create-group'),
    path('api/groups/<int:group_id>/', views.group_details, name='group-details'),
    path('api/groups/<int:group_id>/liked_articles/', views.group_liked_articles, name='group-liked-articles'),
    path('api/groups/<int:group_id>/like_article/', views.like_article_as_group, name='like-article-as-group'),
    path('api/groups/<int:group_id>/send_invite/', views.send_group_invite, name='send_group_invite'),
    path('api/invites/', views.list_invites, name='list_invites'),
    path('api/invites/accept/<int:invite_id>/', views.accept_invite, name='accept_invite'),
    path('api/invites/reject/<int:invite_id>/', views.reject_invite, name='reject_invite'),
    path('api/add-tag/', views.add_tag_to_article, name='add_tag_to_article'),
    path('api/article/<int:article_id>/tags/', views.get_tags_for_article, name='article-tags'),
    path('api/article/<int:article_id>/public_tags/', views.get_publictags, name='public-article-tags'),
    path('api/groups/<int:group_id>/unlike_article/<int:article_id>/', views.unlike_article_as_group, name='unlike_article_as_group'),
    path('api/groups/<int:group_id>/kick_member/<int:member_id>/', views.kick_member, name='kick_member'),
    path('api/groups/delete/<int:group_id>/', views.delete_group, name='delete_group'),
    path('api/articles/update/<int:article_id>/', views.update_article, name='update_article'),
    path('api/categories/', views.CategoryList.as_view(), name='category-list'),
    path('api/generate-bibtex/', views.generate_bibtex, name='generate-bibtex'),
    path('api/create/keyword/', views.create_keyword, name='create_keyword'),
    path('api/groups/<int:group_id>/leave_group/', views.leave_group, name='leave_group'),
    path('api/groups/<int:group_id>/export_bibtex/', views.export_bibtex, name='export_bibtex'),
    path('api/articles/by_category/<int:category_id>/', views.ArticlesByCategory.as_view(), name='articles-by-category'),


] + static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
