from django.urls import path
from . import views
from .views import CurrentUserView
from .views import register_user
from django.urls import path
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView

# URLConf
urlpatterns = [ 
    path('api/token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('api/token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('current_user/', CurrentUserView.as_view(), name='current_user'),
    path('search_articles/', views.search_articles, name='search_articles'),
]    
