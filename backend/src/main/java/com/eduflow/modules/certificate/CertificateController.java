package com.eduflow.modules.certificate;

import com.eduflow.security.UserPrincipal;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/certificates")
public class CertificateController {

    private final CertificateService certificateService;

    public CertificateController(CertificateService certificateService) {
        this.certificateService = certificateService;
    }

    @GetMapping("/unlocked/{courseId}")
    public ResponseEntity<java.util.Map<String, Boolean>> isCertificateUnlocked(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {
        
        boolean unlocked = certificateService.isCertificateUnlocked(userPrincipal.getId(), courseId);
        java.util.Map<String, Boolean> response = new java.util.HashMap<>();
        response.put("unlocked", unlocked);
        return ResponseEntity.ok(response);
    }

    @GetMapping("/download/{courseId}")
    public ResponseEntity<byte[]> downloadCertificate(
            @PathVariable("courseId") Long courseId,
            @AuthenticationPrincipal UserPrincipal userPrincipal) {

        byte[] pdfBytes = certificateService.generateCertificate(userPrincipal.getId(), courseId);

        HttpHeaders headers = new HttpHeaders();
        headers.setContentType(MediaType.APPLICATION_PDF);
        // Instructs the browser to download the file instead of rendering it inline
        headers.setContentDispositionFormData("attachment", "Certificate_Course_" + courseId + ".pdf");
        headers.setCacheControl("must-revalidate, post-check=0, pre-check=0");

        return ResponseEntity.ok()
                .headers(headers)
                .contentLength(pdfBytes.length)
                .body(pdfBytes);
    }
}
