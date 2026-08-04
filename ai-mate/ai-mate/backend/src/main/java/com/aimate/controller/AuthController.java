package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.util.JwtUtil;
import jakarta.servlet.http.HttpServletRequest;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final JwtUtil jwtUtil;

    @PostMapping("/refresh")
    public ApiResponse<Map<String, String>> refreshToken(HttpServletRequest request) {
        // Placeholder - actual implementation would extract refresh token and issue new access token
        return ApiResponse.success("Token refresh endpoint");
    }
}
