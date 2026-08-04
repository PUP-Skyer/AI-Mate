package com.aimate.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

@Data
public class UpdateStartupProfileRequest {
    private String stage;
    private String industry;
    private String productType;
    private String teamSize;
    private String preferences;
}
