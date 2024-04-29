from django.contrib import admin
from django.contrib.auth.admin import UserAdmin
from .models import CustomUser, Article, Category, Tag, Keyword, Group, GroupInvite


# Register your models here.

admin.site.register(CustomUser, UserAdmin)
admin.site.register(Article)
admin.site.register(Category)
admin.site.register(Tag)
admin.site.register(Keyword)
admin.site.register(Group)
admin.site.register(GroupInvite)

