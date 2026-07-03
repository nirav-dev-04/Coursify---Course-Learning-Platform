package com.eduflow;

import org.springframework.boot.SpringApplication;
import org.springframework.boot.autoconfigure.SpringBootApplication;
import org.springframework.scheduling.annotation.EnableAsync;
import org.springframework.scheduling.annotation.EnableScheduling;
import java.net.URI;

@SpringBootApplication
@EnableScheduling
@EnableAsync
public class EduFlowApplication {
    public static void main(String[] args) {
        // Parse DATABASE_URL if present (Render/Heroku standard env var)
        String databaseUrl = System.getenv("DATABASE_URL");
        if (databaseUrl != null && !databaseUrl.isEmpty()) {
            try {
                URI dbUri = new URI(databaseUrl);
                String host = dbUri.getHost();
                int port = dbUri.getPort();
                String path = dbUri.getPath();
                String userInfo = dbUri.getUserInfo();
                
                String dbUrl;
                if (port != -1) {
                    dbUrl = "jdbc:postgresql://" + host + ":" + port + path;
                } else {
                    dbUrl = "jdbc:postgresql://" + host + path;
                }
                
                if (dbUri.getQuery() != null) {
                    dbUrl += "?" + dbUri.getQuery();
                }
                
                System.setProperty("spring.datasource.url", dbUrl);
                
                if (userInfo != null && userInfo.contains(":")) {
                    String[] creds = userInfo.split(":");
                    System.setProperty("spring.datasource.username", creds[0]);
                    System.setProperty("spring.datasource.password", creds[1]);
                }
            } catch (Exception e) {
                System.err.println("Failed to parse DATABASE_URL: " + e.getMessage());
            }
        }

        // Parse REDIS_URL if present (Render standard env var)
        String redisUrl = System.getenv("REDIS_URL");
        if (redisUrl != null && !redisUrl.isEmpty()) {
            System.setProperty("spring.data.redis.url", redisUrl);
        }

        SpringApplication.run(EduFlowApplication.class, args);
    }
}

