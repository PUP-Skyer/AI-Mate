package com.aimate.controller;

import com.aimate.dto.ApiResponse;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/public")
public class HealthController {

    @GetMapping("/health")
    public ApiResponse<String> health() {
        return ApiResponse.success("青宸智汇 Backend is running");
    }
}
