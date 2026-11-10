package com.commerce.gateway.security;

import java.util.Set;
import org.springframework.http.HttpMethod;
import org.springframework.util.AntPathMatcher;
import lombok.*;


@Getter
@Builder
@AllArgsConstructor
public class RouteRule {

    private final String pathPattern; 
    private final Set<String> allowedRoles; 
    private final Set<HttpMethod> matchMethods; 
    private final String requiredPermission; 


    public boolean matches(String path, HttpMethod method) {
        AntPathMatcher matcher = new AntPathMatcher();
        boolean pathMatches = matcher.match(pathPattern, path);

        boolean methodMatches = matchMethods.isEmpty()
                || matchMethods.contains(method);

        return pathMatches && methodMatches;
    }

    public boolean isRoleAllowed(String role) {
        return allowedRoles.contains(role);
    }

    public boolean isPermissionRequired() {
        return requiredPermission != null && !requiredPermission.isBlank();
    }

    public boolean hasRequiredPermission(Set<String> userPermissions) {
        if (!isPermissionRequired()) {
            return true;
        }
        for (String perm : requiredPermission.split(",")) {
            if (userPermissions.contains(perm.trim())) {
                return true;
            }
        }
        return false;
    }


    public static RouteRule adminOnly(String pattern) {
        return RouteRule.builder()
                .pathPattern(pattern)
                .allowedRoles(Set.of("ADMIN"))
                .matchMethods(Set.of())
                .requiredPermission(null)
                .build();
    }

    public static RouteRule forRoles(String pattern, String... roles) {
        return RouteRule.builder()
                .pathPattern(pattern)
                .allowedRoles(Set.of(roles))
                .matchMethods(Set.of())
                .requiredPermission(null)
                .build();
    }

    public static RouteRule forMethod(String pattern,
            HttpMethod method,
            String... roles) {
        return RouteRule.builder()
                .pathPattern(pattern)
                .allowedRoles(Set.of(roles))
                .matchMethods(Set.of(method))
                .requiredPermission(null)
                .build();
    }

    public static RouteRule withPermission(String pattern,
                                            HttpMethod method,
                                            String permission,
                                            String... roles) {
        return RouteRule.builder()
                .pathPattern(pattern)
                .allowedRoles(Set.of(roles))
                .matchMethods(method != null ? Set.of(method) : Set.of())
                .requiredPermission(permission)
                .build();
    }
}