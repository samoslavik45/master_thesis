from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser

class CustomUser(AbstractUser):
    groups = models.ManyToManyField(
        blank=True,
        help_text='The groups this user belongs to. A user will get all permissions granted to each of their groups.',
        related_name="customuser_set", 
        related_query_name="customuser",
        to="auth.Group",
        verbose_name='groups',
    )
    user_permissions = models.ManyToManyField(
        blank=True,
        help_text='Specific permissions for this user.',
        related_name="customuser_set", 
        related_query_name="customuser",
        to="auth.Permission",
        verbose_name='user permissions',
    )
User = get_user_model()

class Tag(models.Model):
    name = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.name
    
class Keyword(models.Model):
    keyword = models.CharField(max_length=100)

    def __str__(self):
        return self.keyword

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    pdf_file = models.FileField(upload_to='articles_pdfs/')
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    authors = models.ManyToManyField('Author', related_name='authored_articles')  # Odkaz na model Author
    categories = models.ManyToManyField('Category', related_name='articles')
    keywords = models.ManyToManyField(Keyword, related_name='articles')

    def __str__(self):
        return self.title

class Category(models.Model):
    name = models.CharField(max_length=100)
    description = models.TextField()

class ArticleLike(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_articles')
    created_at = models.DateTimeField(auto_now_add=True)

class Group(models.Model):
    name = models.CharField(max_length=100)
    members = models.ManyToManyField(User, related_name='custom_groups')
    admin = models.ForeignKey(User, related_name='admin_groups', on_delete=models.CASCADE, null=True)

class GroupArticleLike(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='group_likes')
    group = models.ForeignKey(Group, on_delete=models.CASCADE, related_name='liked_articles')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('article', 'group')  

    def __str__(self):
        return f"{self.group.name} likes {self.article.title}"

class GroupInvite(models.Model):
    group = models.ForeignKey('Group', on_delete=models.CASCADE, related_name='invites')
    invited_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='group_invites')
    sender = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sent_group_invites')
    accepted = models.BooleanField(default=False)

class UserArticleTag(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    tag = models.ForeignKey(Tag, on_delete=models.CASCADE)
    is_public = models.BooleanField(default=True)

    class Meta:
        unique_together = ('user', 'article', 'tag')

class ArticleMetadata(models.Model):
    article = models.OneToOneField(Article, on_delete=models.CASCADE, related_name='metadata')
    authors = models.ManyToManyField('Author', related_name='metadata_authors')  # Zmena na ManyToManyField
    title = models.CharField(max_length=255, blank=True, null=True)
    subject = models.CharField(max_length=255, blank=True, null=True)
    creationDate = models.CharField(max_length=255, blank=True, null=True)
    keywords = models.TextField(blank=True, null=True)  # This can be a comma-separated string of keywords
    creator = models.CharField(max_length=255, blank=True, null=True)
    doi = models.CharField(max_length=255, blank=True, null=True)

    def __str__(self):
        return f"Metadata for {self.article.title}"
    
class Author(models.Model):
    name = models.CharField(max_length=255)

    def __str__(self):
        return self.name
