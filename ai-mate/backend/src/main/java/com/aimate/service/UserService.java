package com.aimate.service;

import com.aimate.dto.UpdateProfileRequest;
import com.aimate.dto.UpdateStartupProfileRequest;
import com.aimate.dto.UserProfileResponse;
import com.aimate.entity.Membership;
import com.aimate.entity.User;
import com.aimate.entity.UserProfile;
import com.aimate.exception.BusinessException;
import com.aimate.repository.MembershipRepository;
import com.aimate.repository.UserProfileRepository;
import com.aimate.repository.UserRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Slf4j
@Service
@RequiredArgsConstructor
public class UserService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MembershipRepository membershipRepository;

    @Transactional(readOnly = true)
    public User getUserById(Long id) {
        return userRepository.findById(id)
                .orElseThrow(() -> new BusinessException("用户不存在"));
    }

    @Transactional(readOnly = true)
    public UserProfileResponse getFullProfile(Long userId) {
        User user = getUserById(userId);

        UserProfileResponse.UserProfileResponseBuilder builder = UserProfileResponse.builder()
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .avatar(user.getAvatar())
                .phone(user.getPhone())
                .role(user.getRole().name());

        // 查询创业档案
        userProfileRepository.findByUserId(userId).ifPresent(profile -> {
            builder.stage(profile.getStage())
                    .industry(profile.getIndustry())
                    .productType(profile.getProductType())
                    .teamSize(profile.getTeamSize())
                    .preferences(profile.getPreferences());
        });

        // 查询会员信息
        membershipRepository.findFirstByUserIdOrderByCreatedAtDesc(userId).ifPresent(membership -> {
            builder.membershipType(membership.getType().name())
                    .membershipStatus(membership.getStatus().name());
        });

        return builder.build();
    }

    @Transactional
    public UserProfileResponse updateProfile(Long userId, UpdateProfileRequest req) {
        User user = getUserById(userId);

        if (req.getNickname() != null) {
            user.setNickname(req.getNickname());
        }
        if (req.getAvatar() != null) {
            user.setAvatar(req.getAvatar());
        }

        userRepository.save(user);
        return getFullProfile(userId);
    }

    @Transactional
    public UserProfileResponse updateStartupProfile(Long userId, UpdateStartupProfileRequest req) {
        UserProfile profile = userProfileRepository.findByUserId(userId)
                .orElseGet(() -> {
                    User user = getUserById(userId);
                    UserProfile newProfile = UserProfile.builder()
                            .user(user)
                            .userId(user.getId())
                            .build();
                    return userProfileRepository.save(newProfile);
                });

        if (req.getStage() != null) {
            profile.setStage(req.getStage());
        }
        if (req.getIndustry() != null) {
            profile.setIndustry(req.getIndustry());
        }
        if (req.getProductType() != null) {
            profile.setProductType(req.getProductType());
        }
        if (req.getTeamSize() != null) {
            profile.setTeamSize(req.getTeamSize());
        }
        if (req.getPreferences() != null) {
            profile.setPreferences(req.getPreferences());
        }

        userProfileRepository.save(profile);
        return getFullProfile(userId);
    }
}
