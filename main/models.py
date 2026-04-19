from django.db import models
from django.contrib.auth import get_user_model
from django.contrib.auth.models import AbstractUser
from django.contrib.postgres.indexes import GinIndex
from django.contrib.postgres.search import SearchVectorField

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
    keyword = models.CharField(max_length=100, unique=True)

    def __str__(self):
        return self.keyword

class Article(models.Model):
    title = models.CharField(max_length=255)
    content = models.TextField()
    full_text = models.TextField(blank=True, default="")   # ⬅️ nové
    search_vector = SearchVectorField(null=True, blank=True)  # ⬅️ nové

    pdf_file = models.FileField(upload_to='articles_pdfs/')
    created_at = models.DateTimeField(auto_now_add=True)
    added_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='articles')
    authors = models.ManyToManyField('Author', related_name='authored_articles')
    categories = models.ManyToManyField('Category', related_name='articles')
    keywords = models.ManyToManyField(Keyword, related_name='articles')

    def __str__(self):
        return self.title

    class Meta:
        indexes = [
            GinIndex(fields=['search_vector'], name='article_search_vector_gin'),
        ]

class Category(models.Model):
    name = models.CharField(max_length=100, unique=True)
    description = models.TextField()

class ArticleLike(models.Model):
    article = models.ForeignKey(Article, on_delete=models.CASCADE, related_name='likes')
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='liked_articles')
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('article', 'user')

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

    class Meta:
        unique_together = ('group', 'invited_user')


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
    name = models.CharField(max_length=255, unique=True)

    def __str__(self):
        return self.name

class ArticleEmbedding(models.Model):
    article = models.ForeignKey(
        Article,
        on_delete=models.CASCADE,
        related_name='embeddings'
    )
    vector = models.JSONField()  # list of floats
    model_name = models.CharField(max_length=100)  # e.g. 'tfidf-v1' or 'sbert-v1'
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        constraints = [
            models.UniqueConstraint(
                fields=['article', 'model_name'],
                name='unique_article_model_embedding'
            )
        ]

class UserInteraction(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    article = models.ForeignKey(Article, on_delete=models.CASCADE)
    # 1 = like, 2 = click_reco, 3 = dismiss_reco
    kind = models.PositiveSmallIntegerField()
    created_at = models.DateTimeField(auto_now_add=True)

class RecommendationCache(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE)
    payload = models.JSONField()  # list of dicts {id: ..., score: ...}
    algo = models.CharField(max_length=50)
    created_at = models.DateTimeField(auto_now_add=True)

class GroupMessage(models.Model):
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='messages'
    )
    user = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_messages'
    )
    article = models.ForeignKey(
        Article,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='group_messages'
    )
    parent = models.ForeignKey(
        'self',
        on_delete=models.CASCADE,
        null=True,
        blank=True,
        related_name='replies'
    )
    mentioned_users = models.ManyToManyField(
        User,
        blank=True,
        related_name='mentioned_in_group_messages'
    )
    content = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ['created_at']

    def __str__(self):
        return f"{self.user.username} in {self.group.name}"

class GroupNotification(models.Model):
    NOTIFICATION_TYPES = [
        ('mention', 'Mention'),
    ]

    recipient = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='group_notifications'
    )
    sender = models.ForeignKey(
        User,
        on_delete=models.CASCADE,
        related_name='sent_group_notifications'
    )
    group = models.ForeignKey(
        Group,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    message = models.ForeignKey(
        GroupMessage,
        on_delete=models.CASCADE,
        related_name='notifications'
    )
    notification_type = models.CharField(
        max_length=20,
        choices=NOTIFICATION_TYPES,
        default='mention'
    )
    is_read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']