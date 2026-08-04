package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.security.CustomUserDetails;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
public class UserController {

    @GetMapping("/info")
    public ApiResponse<Map<String, Object>> getUserInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(Map.of(
                "userId", userDetails.getId(),
                "username", userDetails.getUsername(),
                "role", userDetails.getRole().name()
        ));
    }
}
