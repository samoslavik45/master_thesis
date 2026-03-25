from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Article, Category, GroupNotification, Tag, Keyword, Group, GroupInvite, Author, GroupMessage

User = get_user_model()



class AuthorsField(serializers.Field):
    def to_internal_value(self, data):
        print("dáta:", data)
        if isinstance(data, list):
            names = data
        else:
            names = data.split(',')
        authors = []
        for name in names:
            trimmed_name = name.strip()
            if trimmed_name:
                author, created = Author.objects.get_or_create(name=trimmed_name)
                authors.append(author)
        return authors

    def to_representation(self, value):
        return [author.name for author in value.all()]


class ArticleSerializer(serializers.ModelSerializer):
    categories = serializers.PrimaryKeyRelatedField(queryset=Category.objects.all(), many=True)
    authors = AuthorsField()
    keywords = serializers.PrimaryKeyRelatedField(many=True, read_only=True)
    class Meta:
        model = Article
        fields = ['id', 'title', 'content', 'pdf_file', 'added_by', 'authors', 'created_at', 'categories', 'keywords']
        read_only_fields = ['added_by']  # added_by bude nastavené automaticky

    def create(self, validated_data):
        validated_data['added_by'] = self.context['request'].user
        return super().create(validated_data)
    
    def update(self, instance, validated_data):
        authors_data = validated_data.pop('authors', None)
        if authors_data is not None:
            instance.authors.set(authors_data)

        print("validate_data:", validated_data)
        categories_data = validated_data.pop('categories', None)
        if categories_data is not None:
            print("ideme meniť:", categories_data)
            instance.categories.set(categories_data)

        for attr, value in validated_data.items():
            setattr(instance, attr, value)

        instance.save()
        return instance

    
    def get_keywords(self, obj):
        return [{'id': keyword.id, 'name': keyword.name} for keyword in obj.keywords.all()]
    
    

class CategorySerializer(serializers.ModelSerializer):
    class Meta:
        model = Category
        fields = '__all__'

class TagSerializer(serializers.ModelSerializer):
    class Meta:
        model = Tag
        fields = ['id', 'name']

class KeywordSerializer(serializers.ModelSerializer):
    class Meta:
        model = Keyword
        fields = '__all__'

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ('id', 'first_name', 'last_name', 'username')

class GroupSerializer(serializers.ModelSerializer):
    members = UserSerializer(many=True, read_only=True)
    admin = UserSerializer(read_only=True)

    class Meta:
        model = Group
        fields = ['id', 'name', 'members', 'admin']

class GroupInviteSerializer(serializers.ModelSerializer):
    group_name = serializers.ReadOnlyField(source='group.name')
    sender_name = serializers.ReadOnlyField(source='sender.username')
    class Meta:
        model = GroupInvite
        fields = ('id', 'group', 'group_name', 'invited_user', 'sender', 'sender_name', 'accepted')

class GroupMessageSerializer(serializers.ModelSerializer):
    author_name = serializers.SerializerMethodField()
    article_title = serializers.SerializerMethodField()
    can_delete = serializers.SerializerMethodField()
    parent_id = serializers.IntegerField(source='parent.id', read_only=True)
    parent_preview = serializers.SerializerMethodField()
    mentioned_user_ids = serializers.SerializerMethodField()
    mentioned_usernames = serializers.SerializerMethodField()
    replies_count = serializers.SerializerMethodField()

    class Meta:
        model = GroupMessage
        fields = [
            'id',
            'group',
            'user',
            'author_name',
            'article',
            'article_title',
            'parent_id',
            'parent_preview',
            'content',
            'created_at',
            'updated_at',
            'can_delete',
            'mentioned_user_ids',
            'mentioned_usernames',
            'replies_count',
        ]
        read_only_fields = [
            'group',
            'user',
            'author_name',
            'article_title',
            'parent_id',
            'parent_preview',
            'created_at',
            'updated_at',
            'can_delete',
            'mentioned_user_ids',
            'mentioned_usernames',
            'replies_count',
        ]

    def get_author_name(self, obj):
        full_name = f"{obj.user.first_name} {obj.user.last_name}".strip()
        return full_name if full_name else obj.user.username

    def get_article_title(self, obj):
        return obj.article.title if obj.article else None

    def get_can_delete(self, obj):
        request = self.context.get('request')
        return bool(request and request.user.is_authenticated and obj.user == request.user)

    def get_parent_preview(self, obj):
        if not obj.parent:
            return None
        preview = obj.parent.content[:120]
        return preview + ("..." if len(obj.parent.content) > 120 else "")

    def get_mentioned_user_ids(self, obj):
        return list(obj.mentioned_users.values_list('id', flat=True))

    def get_mentioned_usernames(self, obj):
        return list(obj.mentioned_users.values_list('username', flat=True))

    def get_replies_count(self, obj):
        return obj.replies.count()
    
class GroupNotificationSerializer(serializers.ModelSerializer):
    sender_name = serializers.SerializerMethodField()
    group_name = serializers.CharField(source='group.name', read_only=True)
    message_content = serializers.CharField(source='message.content', read_only=True)

    class Meta:
        model = GroupNotification
        fields = [
            'id',
            'notification_type',
            'is_read',
            'created_at',
            'group',
            'group_name',
            'message',
            'message_content',
            'sender',
            'sender_name',
        ]

    def get_sender_name(self, obj):
        return f"{obj.sender.first_name} {obj.sender.last_name}".strip() or obj.sender.username