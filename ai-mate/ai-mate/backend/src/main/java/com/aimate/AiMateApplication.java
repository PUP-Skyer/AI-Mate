package com.aimate;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.data.jpa.repository.config.EnableJpaAuditing;

@SpringBootApplication
@EnableJpaAuditing
public class AiMateApplication {

    public static void main(String[] args) {
        SpringApplication.run(AiMateApplication.class, args);
    }
}
