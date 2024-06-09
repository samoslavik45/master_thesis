from rest_framework import serializers
from django.contrib.auth import get_user_model
from .models import Article, Category, Tag, Keyword, Group, GroupInvite, Author

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
    keywords = serializers.PrimaryKeyRelatedField(queryset=Keyword.objects.all(), many=True, required=False)
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

        keywords_data = validated_data.pop('keywords', None)
        if keywords_data is not None:
            instance.keywords.set(keywords_data)

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
