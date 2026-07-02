package com.eduflow.config;

import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Configuration;
import org.springframework.core.io.Resource;
import org.springframework.core.io.ResourceLoader;

import java.io.InputStream;
import java.nio.charset.StandardCharsets;
import java.security.KeyFactory;
import java.security.PrivateKey;
import java.security.Signature;
import java.security.spec.PKCS8EncodedKeySpec;
import java.time.Instant;
import java.time.temporal.ChronoUnit;
import java.util.Base64;
import java.util.HashMap;
import java.util.Map;

@Configuration
@Slf4j
public class CloudFrontConfig {

    private final ResourceLoader resourceLoader;

    @Value("${aws.cloudfront.domain:d111111abcdef8.cloudfront.net}")
    private String cloudFrontDomain;

    @Value("${aws.cloudfront.private-key-path:classpath:cloudfront-private-key.der}")
    private String privateKeyPath;

    @Value("${aws.cloudfront.key-pair-id:K2JC2123456789}")
    private String keyPairId;

    public CloudFrontConfig(ResourceLoader resourceLoader) {
        this.resourceLoader = resourceLoader;
    }

    /**
     * Generates active signed cookies headers for the specified course video resource directory path.
     * Mapped path: https://{cloudfrontDomain}/courses/{courseId}/*
     */
    public Map<String, String> generateSignedCookies(Long courseId) {
        log.info("Generating CloudFront HLS signed cookies for Course: {}", courseId);
        
        String resourceUrl = String.format("https://%s/courses/%d/*", cloudFrontDomain, courseId);
        Instant expiresAt = Instant.now().plus(15, ChronoUnit.MINUTES); // 15 minute TTL
        long expiresEpoch = expiresAt.getEpochSecond();

        // Custom Policy JSON block
        String policy = String.format(
                "{\"Statement\":[{\"Resource\":\"%s\",\"Condition\":{\"DateLessThan\":{\"AWS:EpochTime\":%d}}}]}",
                resourceUrl, expiresEpoch
        );

        Map<String, String> cookies = new HashMap<>();
        try {
            // Encode policy
            String encodedPolicy = base64SafeUrlEncode(policy.getBytes(StandardCharsets.UTF_8));
            
            // Read RSA private key
            PrivateKey privateKey = getPrivateKey();
            
            // Sign the policy using SHA1withRSA
            Signature signature = Signature.getInstance("SHA1withRSA");
            signature.initSign(privateKey);
            signature.update(policy.getBytes(StandardCharsets.UTF_8));
            byte[] signedBytes = signature.sign();
            
            String encodedSignature = base64SafeUrlEncode(signedBytes);

            // Populate CloudFront signed cookies
            cookies.put("CloudFront-Policy", encodedPolicy);
            cookies.put("CloudFront-Signature", encodedSignature);
            cookies.put("CloudFront-Key-Pair-Id", keyPairId);

        } catch (Exception e) {
            log.error("Failed to sign CloudFront HLS cookies", e);
        }

        return cookies;
    }

    private PrivateKey getPrivateKey() throws Exception {
        Resource resource = resourceLoader.getResource(privateKeyPath);
        
        try (InputStream is = resource.getInputStream()) {
            byte[] keyBytes = is.readAllBytes();
            PKCS8EncodedKeySpec spec = new PKCS8EncodedKeySpec(keyBytes);
            KeyFactory kf = KeyFactory.getInstance("RSA");
            return kf.generatePrivate(spec);
        }
    }

    private String base64SafeUrlEncode(byte[] bytes) {
        return Base64.getEncoder().encodeToString(bytes)
                .replace('+', '-')
                .replace('=', '_')
                .replace('/', '~');
    }
}
