package com.aimate.dto;

import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class UserProfileResponse {
    private Long userId;
    private String email;
    private String nickname;
    private String avatar;
    private String phone;
    private String role;
    // 创业档案
    private String stage;
    private String industry;
    private String productType;
    private String teamSize;
    private String preferences;
    // 会员信息
    private String membershipType;
    private String membershipStatus;
}
