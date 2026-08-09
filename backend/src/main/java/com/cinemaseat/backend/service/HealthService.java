package com.cinemaseat.backend.service;

import com.cinemaseat.backend.dto.HealthResponse;
import org.springframework.jdbc.core.JdbcTemplate;
import org.springframework.stereotype.Service;

import java.time.Instant;

@Service
public class HealthService {

    private final JdbcTemplate jdbcTemplate;

    public HealthService(JdbcTemplate jdbcTemplate) {
        this.jdbcTemplate = jdbcTemplate;
    }

    public HealthResponse checkHealth() {
        String dbStatus = "UP";
        try {
            jdbcTemplate.queryForObject("SELECT 1", Integer.class);
        } catch (Exception e) {
            dbStatus = "DOWN: " + e.getMessage();
        }

        return new HealthResponse("UP", dbStatus, Instant.now());
    }
}
