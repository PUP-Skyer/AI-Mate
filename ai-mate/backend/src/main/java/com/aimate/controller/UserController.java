package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import com.aimate.dto.UpdateProfileRequest;
import com.aimate.dto.UpdateStartupProfileRequest;
import com.aimate.dto.UserProfileResponse;
import com.aimate.security.CustomUserDetails;
import com.aimate.service.UserService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/user")
@RequiredArgsConstructor
public class UserController {

    private final UserService userService;

    @GetMapping("/info")
    public ApiResponse<Map<String, Object>> getUserInfo(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(Map.of(
                "userId", userDetails.getId(),
                "username", userDetails.getUsername(),
                "role", userDetails.getRole().name()
        ));
    }

    @GetMapping("/profile")
    public ApiResponse<UserProfileResponse> getFullProfile(@AuthenticationPrincipal CustomUserDetails userDetails) {
        return ApiResponse.success(userService.getFullProfile(userDetails.getId()));
    }

    @PutMapping("/profile")
    public ApiResponse<UserProfileResponse> updateProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateProfileRequest request) {
        return ApiResponse.success(userService.updateProfile(userDetails.getId(), request));
    }

    @PutMapping("/startup-profile")
    public ApiResponse<UserProfileResponse> updateStartupProfile(
            @AuthenticationPrincipal CustomUserDetails userDetails,
            @Valid @RequestBody UpdateStartupProfileRequest request) {
        return ApiResponse.success(userService.updateStartupProfile(userDetails.getId(), request));
    }
}
