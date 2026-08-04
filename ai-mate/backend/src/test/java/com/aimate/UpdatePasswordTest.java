package com.aimate;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

@SpringBootTest
public class UpdatePasswordTest {
    @Autowired
    private JdbcTemplate jdbcTemplate;

    @Test
    public void update() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Test1234");
        jdbcTemplate.update("UPDATE users SET password = ? WHERE email = ?", hash, "test@aimate.com");
        System.out.println("Updated password hash: " + hash);
    }
}
