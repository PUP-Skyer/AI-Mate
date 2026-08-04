package com.aimate.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateProfileRequest {
    @Size(max = 50, message = "昵称最多50个字符")
    private String nickname;

    @Size(max = 500, message = "头像URL最多500个字符")
    private String avatar;
}
