package com.aimate.service;

import com.aimate.dto.AuthResponse;
import com.aimate.dto.LoginRequest;
import com.aimate.dto.RegisterRequest;
import com.aimate.entity.Membership;
import com.aimate.entity.User;
import com.aimate.entity.UserProfile;
import com.aimate.exception.BusinessException;
import com.aimate.repository.MembershipRepository;
import com.aimate.repository.UserProfileRepository;
import com.aimate.repository.UserRepository;
import com.aimate.security.CustomUserDetails;
import com.aimate.util.JwtUtil;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.Map;

@Slf4j
@Service
@RequiredArgsConstructor
public class AuthService {

    private final UserRepository userRepository;
    private final UserProfileRepository userProfileRepository;
    private final MembershipRepository membershipRepository;
    private final PasswordEncoder passwordEncoder;
    private final AuthenticationManager authenticationManager;
    private final JwtUtil jwtUtil;
    private final CustomUserDetailsService customUserDetailsService;

    @Transactional
    public AuthResponse register(RegisterRequest req) {
        // 检查邮箱是否已注册
        if (userRepository.existsByEmail(req.getEmail())) {
            throw new BusinessException("该邮箱已注册");
        }

        // 创建 User
        String nickname = (req.getNickname() != null && !req.getNickname().isBlank())
                ? req.getNickname()
                : req.getEmail().substring(0, req.getEmail().indexOf('@'));

        User user = User.builder()
                .email(req.getEmail())
                .password(passwordEncoder.encode(req.getPassword()))
                .nickname(nickname)
                .role(User.UserRole.USER)
                .status(User.UserStatus.ACTIVE)
                .build();
        user = userRepository.save(user);

        // 创建 UserProfile
        UserProfile userProfile = UserProfile.builder()
                .user(user)
                .userId(user.getId())
                .build();
        userProfileRepository.save(userProfile);

        // 创建 Membership
        Membership membership = Membership.builder()
                .user(user)
                .userId(user.getId())
                .type(Membership.MembershipType.FREE)
                .startDate(LocalDate.now())
                .endDate(LocalDate.now().plusDays(365))
                .status(Membership.MembershipStatus.ACTIVE)
                .build();
        membershipRepository.save(membership);

        // 生成 Token
        CustomUserDetails userDetails = CustomUserDetails.fromEntity(user);
        String accessToken = jwtUtil.generateToken(userDetails);
        String refreshToken = jwtUtil.generateRefreshToken(userDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
    }

    @Transactional(readOnly = true)
    public AuthResponse login(LoginRequest req) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(req.getEmail(), req.getPassword())
            );
        } catch (BadCredentialsException e) {
            throw new BusinessException("用户名或密码错误");
        }

        // 重新加载用户获取最新信息
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(req.getEmail());
        CustomUserDetails customUserDetails = (CustomUserDetails) userDetails;

        // 从数据库获取完整用户信息
        User user = userRepository.findByEmail(req.getEmail())
                .orElseThrow(() -> new BusinessException("用户不存在"));

        String accessToken = jwtUtil.generateToken(customUserDetails);
        String refreshToken = jwtUtil.generateRefreshToken(customUserDetails);

        return AuthResponse.builder()
                .accessToken(accessToken)
                .refreshToken(refreshToken)
                .userId(user.getId())
                .email(user.getEmail())
                .nickname(user.getNickname())
                .role(user.getRole().name())
                .build();
    }

    @Transactional(readOnly = true)
    public Map<String, String> refreshToken(String refreshToken) {
        String username = jwtUtil.extractUsername(refreshToken);
        UserDetails userDetails = customUserDetailsService.loadUserByUsername(username);

        if (!jwtUtil.isTokenValid(refreshToken, userDetails)) {
            throw new BusinessException("刷新令牌无效或已过期");
        }

        String newAccessToken = jwtUtil.generateToken(userDetails);
        return Map.of("accessToken", newAccessToken);
    }
}
