package com.aimate;

import org.junit.jupiter.api.Test;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;

public class GenHashTest {
    @Test
    public void gen() {
        BCryptPasswordEncoder encoder = new BCryptPasswordEncoder();
        String hash = encoder.encode("Test1234");
        System.out.println("HASH: " + hash);
        System.out.println("MATCH: " + encoder.matches("Test1234", hash));
    }
}
