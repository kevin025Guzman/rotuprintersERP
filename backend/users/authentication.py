from rest_framework_simplejwt.authentication import JWTAuthentication


class QueryParamJWTAuthentication(JWTAuthentication):
    """Allow JWT tokens via Authorization header or ?token= query param."""

    query_param_name = 'token'

    def authenticate(self, request):
        header = self.get_header(request)
        if header is None:
            raw_token = request.query_params.get(self.query_param_name)
            if raw_token:
                validated_token = self.get_validated_token(raw_token)
                return self.get_user(validated_token), validated_token

        return super().authenticate(request)
