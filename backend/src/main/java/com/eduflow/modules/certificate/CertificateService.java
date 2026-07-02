package com.eduflow.modules.certificate;

import com.eduflow.exception.ResourceNotFoundException;
import com.eduflow.modules.course.Course;
import com.eduflow.modules.course.CourseRepository;
import com.eduflow.modules.course.Section;
import com.eduflow.modules.course.SectionRepository;
import com.eduflow.modules.course.Lecture;
import com.eduflow.modules.course.LectureRepository;
import com.eduflow.modules.course.PracticeTestAttemptRepository;
import com.eduflow.modules.progress.ProgressTracker;
import com.eduflow.modules.enrollment.Enrollment;
import com.eduflow.modules.enrollment.EnrollmentRepository;
import com.lowagie.text.*;
import com.lowagie.text.pdf.BaseFont;
import com.lowagie.text.pdf.PdfContentByte;
import com.lowagie.text.pdf.PdfPCell;
import com.lowagie.text.pdf.PdfPCellEvent;
import com.lowagie.text.pdf.PdfPTable;
import com.lowagie.text.pdf.PdfWriter;
import com.lowagie.text.pdf.ColumnText;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.io.ByteArrayOutputStream;
import java.security.MessageDigest;
import java.time.format.DateTimeFormatter;
import java.time.LocalDateTime;
import java.awt.Color;
import java.util.List;
import java.util.Map;

@Service
public class CertificateService {

    private final EnrollmentRepository enrollmentRepository;
    private final CourseRepository courseRepository;
    private final SectionRepository sectionRepository;
    private final LectureRepository lectureRepository;
    private final ProgressTracker progressTracker;
    private final PracticeTestAttemptRepository attemptRepository;

    public CertificateService(EnrollmentRepository enrollmentRepository, 
                              CourseRepository courseRepository,
                              SectionRepository sectionRepository,
                              LectureRepository lectureRepository,
                              ProgressTracker progressTracker,
                              PracticeTestAttemptRepository attemptRepository) {
        this.enrollmentRepository = enrollmentRepository;
        this.courseRepository = courseRepository;
        this.sectionRepository = sectionRepository;
        this.lectureRepository = lectureRepository;
        this.progressTracker = progressTracker;
        this.attemptRepository = attemptRepository;
    }

    @Transactional
    public byte[] generateCertificate(Long userId, Long courseId) {
        // 1. Verify Enrollment
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId)
                .orElseThrow(() -> new ResourceNotFoundException("You are not enrolled in this course."));

        Course course = enrollment.getCourse();

        // Check if practice test is completed with pass score
        if ("PRACTICE_TEST".equalsIgnoreCase(course.getType())) {
            boolean hasPassed = attemptRepository.existsByUserIdAndCourseIdAndPassedTrue(userId, courseId);
            if (!hasPassed) {
                throw new IllegalArgumentException("You must pass the Practice Test with a score of 70% or higher to claim your certificate.");
            }
        } else {
            if (!enrollment.isCompleted()) {
                int progress = calculateProgress(userId, courseId);
                if (progress < 100) {
                    throw new IllegalArgumentException("You must complete 100% of the course to claim your certificate. Current progress: " + progress + "%");
                }
                enrollment.setCompleted(true);
                enrollment.setCompletedAt(LocalDateTime.now());
                enrollmentRepository.save(enrollment);
            }
        }

        com.eduflow.modules.user.User user = enrollment.getUser();

        // 2. Generate PDF using OpenPDF
        ByteArrayOutputStream out = new ByteArrayOutputStream();
        
        // Define page size (Landscape A4 is standard for certificates)
        Document document = new Document(PageSize.A4.rotate(), 60, 60, 60, 60);

        try {
            PdfWriter writer = PdfWriter.getInstance(document, out);
            document.open();

            // Draw decorative backgrounds and borders using PdfContentByte
            PdfContentByte canvas = writer.getDirectContent();

            // Background fill (Premium off-white/ivory)
            canvas.setColorFill(new Color(253, 252, 250));
            canvas.rectangle(0, 0, 842, 595);
            canvas.fill();

            // 1. Draw top-left navy-blue background header
            canvas.setColorFill(new Color(21, 47, 78)); // Navy
            canvas.moveTo(0, 595);
            canvas.lineTo(550, 595);
            canvas.lineTo(0, 360);
            canvas.closePath();
            canvas.fill();

            // Gold slope line
            canvas.setColorStroke(new Color(197, 160, 89)); // Gold
            canvas.setLineWidth(3f);
            canvas.moveTo(0, 360);
            canvas.lineTo(550, 595);
            canvas.stroke();

            // 2. Draw left vertical stripe
            canvas.setColorFill(new Color(21, 47, 78)); // Navy
            canvas.rectangle(0, 0, 100, 360);
            canvas.fill();

            canvas.setColorStroke(new Color(197, 160, 89)); // Gold
            canvas.setLineWidth(2f);
            canvas.moveTo(100, 0);
            canvas.lineTo(100, 400); // overlaps slightly with top header
            canvas.stroke();

            // Double line detail on left stripe
            canvas.setColorStroke(new Color(21, 47, 78));
            canvas.setLineWidth(1f);
            canvas.moveTo(103, 0);
            canvas.lineTo(103, 400);
            canvas.stroke();

            // 3. Draw top-right navy-blue wave/curve
            canvas.setColorFill(new Color(21, 47, 78)); // Navy
            canvas.moveTo(600, 595);
            canvas.lineTo(842, 595);
            canvas.lineTo(842, 450);
            canvas.curveTo(780, 480, 680, 550, 600, 595);
            canvas.closePath();
            canvas.fill();

            // Gold border for top-right curve
            canvas.setColorStroke(new Color(197, 160, 89)); // Gold
            canvas.setLineWidth(2.5f);
            canvas.moveTo(600, 595);
            canvas.curveTo(680, 550, 780, 480, 842, 450);
            canvas.stroke();

            // 4. Draw Gold Medallion on the left stripe
            canvas.setColorFill(new Color(197, 160, 89)); // Gold
            canvas.circle(100, 200, 35);
            canvas.fill();

            canvas.setColorStroke(Color.WHITE);
            canvas.setLineWidth(1.2f);
            canvas.circle(100, 200, 30);
            canvas.stroke();

            // Text inside the left medallion
            canvas.beginText();
            canvas.setFontAndSize(BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED), 7);
            canvas.setColorFill(Color.WHITE);
            canvas.showTextAligned(Element.ALIGN_CENTER, "BEST", 100, 208, 0);
            canvas.showTextAligned(Element.ALIGN_CENTER, "AWARD", 100, 198, 0);
            canvas.showTextAligned(Element.ALIGN_CENTER, "2026", 100, 188, 0);
            canvas.endText();

            // 5. Draw "CERTIFICATE OF COMPLETION" on the top-left navy background
            canvas.beginText();
            canvas.setFontAndSize(BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED), 26);
            canvas.setColorFill(new Color(197, 160, 89)); // Gold
            canvas.showTextAligned(Element.ALIGN_LEFT, "CERTIFICATE", 40, 520, 0);
            
            canvas.setFontAndSize(BaseFont.createFont(BaseFont.HELVETICA_BOLD, BaseFont.CP1252, BaseFont.NOT_EMBEDDED), 13);
            canvas.setColorFill(Color.WHITE);
            canvas.showTextAligned(Element.ALIGN_LEFT, "OF COMPLETION", 40, 498, 0);
            canvas.endText();

            // Background wave lines (Subtle light gold waves in the clean area)
            canvas.setColorStroke(new Color(245, 240, 222));
            canvas.setLineWidth(1f);
            for (int i = 0; i < 4; i++) {
                canvas.moveTo(120, 60 + i * 40);
                canvas.curveTo(350, 140 + i * 20, 600, 40 + i * 10, 820, 110 + i * 30);
                canvas.stroke();
            }

            // Setup ColumnText for centered content layout in the remaining clean area
            // x from 140 to 800, y from 40 to 440
            ColumnText ct = new ColumnText(canvas);
            ct.setSimpleColumn(140, 40, 800, 440);

            // Fonts
            Font academyFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 10, Font.BOLD, new Color(197, 160, 89)); // Gold
            Font nameFont = FontFactory.getFont(FontFactory.TIMES_BOLDITALIC, 32, Font.BOLD | Font.ITALIC, new Color(28, 29, 31)); // Charcoal
            Font courseIntroFont = FontFactory.getFont(FontFactory.HELVETICA, 11, Font.NORMAL, Color.GRAY);
            Font courseFont = FontFactory.getFont(FontFactory.HELVETICA_BOLD, 22, Font.BOLD, new Color(21, 47, 78)); // Deep Navy

            // Spacer paragraphs
            Paragraph spacingLarge = new Paragraph("\n\n");
            Paragraph spacingSmall = new Paragraph("\n");

            // Academy Brand Header (top of clean area)
            Paragraph academyHeader = new Paragraph("EDUFLOW ONLINE ACADEMY", academyFont);
            academyHeader.setAlignment(Element.ALIGN_CENTER);
            ct.addElement(academyHeader);

            ct.addElement(spacingLarge);

            // Student Name
            Paragraph name = new Paragraph(user.getName(), nameFont);
            name.setAlignment(Element.ALIGN_CENTER);
            ct.addElement(name);
            
            // Gold underline table
            PdfPTable nameLineTable = new PdfPTable(1);
            nameLineTable.setWidthPercentage(70);
            PdfPCell nameLineCell = new PdfPCell();
            nameLineCell.setBorder(Rectangle.BOTTOM);
            nameLineCell.setBorderWidth(1.5f);
            nameLineCell.setBorderColor(new Color(197, 160, 89)); // Gold line
            nameLineCell.setPadding(0);
            nameLineTable.addCell(nameLineCell);
            nameLineTable.setSpacingBefore(8);
            nameLineTable.setSpacingAfter(20);
            ct.addElement(nameLineTable);

            // Body
            Paragraph body = new Paragraph("for successfully completing the premium curriculum of the online course", courseIntroFont);
            body.setAlignment(Element.ALIGN_CENTER);
            ct.addElement(body);

            ct.addElement(spacingSmall);

            // Course Name
            Paragraph courseName = new Paragraph("\"" + course.getTitle() + "\"", courseFont);
            courseName.setAlignment(Element.ALIGN_CENTER);
            ct.addElement(courseName);

            // Course Details Subtitle
            Paragraph courseDetails = new Paragraph("A comprehensive specialization program verifying complete competency in the subject matter.", FontFactory.getFont(FontFactory.HELVETICA_OBLIQUE, 8.5f, Font.ITALIC, Color.GRAY));
            courseDetails.setAlignment(Element.ALIGN_CENTER);
            courseDetails.setSpacingBefore(5);
            ct.addElement(courseDetails);

            // Footer table (Registrar, Date, Instructor)
            PdfPTable footerTable = new PdfPTable(3);
            footerTable.setWidthPercentage(100);
            footerTable.setWidths(new float[]{3.2f, 2.0f, 3.2f});
            footerTable.setSpacingBefore(30);

            // Left: Registrar Signature Block
            PdfPCell leftCell = new PdfPCell();
            leftCell.setBorder(Rectangle.NO_BORDER);
            leftCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            Paragraph sigLine1 = new Paragraph("_________________________", FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, Color.LIGHT_GRAY));
            sigLine1.setAlignment(Element.ALIGN_CENTER);
            Paragraph label1 = new Paragraph("REGISTRAR SIGNATURE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Font.BOLD, Color.DARK_GRAY));
            label1.setAlignment(Element.ALIGN_CENTER);
            Paragraph subLabel1 = new Paragraph("EduFlow Online Registry", FontFactory.getFont(FontFactory.HELVETICA, 7, Font.NORMAL, Color.GRAY));
            subLabel1.setAlignment(Element.ALIGN_CENTER);
            
            leftCell.addElement(sigLine1);
            leftCell.addElement(label1);
            leftCell.addElement(subLabel1);
            
            leftCell.setCellEvent(new PdfPCellEvent() {
                @Override
                public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
                    PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
                    cb.setColorStroke(new Color(25, 55, 120)); // Blue ink
                    cb.setLineWidth(1.6f);
                    float x = position.getLeft() + (position.getWidth() - 100) / 2;
                    float y = position.getBottom() + 28;
                    cb.moveTo(x, y);
                    cb.curveTo(x + 20, y + 15, x + 40, y - 15, x + 60, y + 10);
                    cb.curveTo(x + 75, y - 5, x + 85, y - 10, x + 100, y + 5);
                    cb.stroke();
                }
            });
            footerTable.addCell(leftCell);

            // Center: Date and Verification
            PdfPCell centerCell = new PdfPCell();
            centerCell.setBorder(Rectangle.NO_BORDER);
            centerCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            DateTimeFormatter formatter = DateTimeFormatter.ofPattern("MMMM dd, yyyy");
            String formattedDate = enrollment.getEnrolledAt() != null 
                    ? enrollment.getEnrolledAt().format(formatter)
                    : java.time.LocalDateTime.now().format(formatter);
            
            Paragraph dateLabel = new Paragraph("DATE OF ISSUANCE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7, Font.BOLD, Color.GRAY));
            dateLabel.setAlignment(Element.ALIGN_CENTER);
            Paragraph dateValue = new Paragraph(formattedDate, FontFactory.getFont(FontFactory.HELVETICA_BOLD, 9, Font.BOLD, Color.BLACK));
            dateValue.setAlignment(Element.ALIGN_CENTER);
            
            String signData = userId + ":" + courseId + ":" + (enrollment.getEnrolledAt() != null ? enrollment.getEnrolledAt().toString() : "COMPLETED");
            String verificationHash = calculateSha256(signData);
            Paragraph hashLine = new Paragraph("ID: " + verificationHash.substring(0, 12).toUpperCase(), FontFactory.getFont(FontFactory.COURIER, 7, Font.NORMAL, Color.GRAY));
            hashLine.setAlignment(Element.ALIGN_CENTER);
            hashLine.setSpacingBefore(4);
            
            centerCell.addElement(dateLabel);
            centerCell.addElement(dateValue);
            centerCell.addElement(hashLine);
            footerTable.addCell(centerCell);

            // Right: Instructor Signature Block
            PdfPCell rightCell = new PdfPCell();
            rightCell.setBorder(Rectangle.NO_BORDER);
            rightCell.setHorizontalAlignment(Element.ALIGN_CENTER);
            
            String instructorName = course.getInstructor() != null ? course.getInstructor().getName() : "Course Instructor";
            Paragraph sigLine2 = new Paragraph("_________________________", FontFactory.getFont(FontFactory.HELVETICA, 10, Font.NORMAL, Color.LIGHT_GRAY));
            sigLine2.setAlignment(Element.ALIGN_CENTER);
            Paragraph label2 = new Paragraph("INSTRUCTOR SIGNATURE", FontFactory.getFont(FontFactory.HELVETICA_BOLD, 7.5f, Font.BOLD, Color.DARK_GRAY));
            label2.setAlignment(Element.ALIGN_CENTER);
            Paragraph subLabel2 = new Paragraph(instructorName, FontFactory.getFont(FontFactory.HELVETICA, 7, Font.NORMAL, Color.GRAY));
            subLabel2.setAlignment(Element.ALIGN_CENTER);
            
            rightCell.addElement(sigLine2);
            rightCell.addElement(label2);
            rightCell.addElement(subLabel2);
            
            rightCell.setCellEvent(new PdfPCellEvent() {
                @Override
                public void cellLayout(PdfPCell cell, Rectangle position, PdfContentByte[] canvases) {
                    PdfContentByte cb = canvases[PdfPTable.TEXTCANVAS];
                    cb.setColorStroke(new Color(25, 55, 120)); // Blue ink
                    cb.setLineWidth(1.6f);
                    float x = position.getLeft() + (position.getWidth() - 100) / 2;
                    float y = position.getBottom() + 28;
                    cb.moveTo(x, y);
                    cb.curveTo(x + 20, y + 15, x + 40, y - 15, x + 60, y + 10);
                    cb.curveTo(x + 75, y - 5, x + 85, y - 10, x + 100, y + 5);
                    cb.stroke();
                }
            });
            footerTable.addCell(rightCell);

            ct.addElement(footerTable);

            ct.go();

            document.close();
            return out.toByteArray();
        } catch (DocumentException | java.io.IOException e) {
            throw new RuntimeException("Error generating PDF certificate document: " + e.getMessage(), e);
        }
    }

    @Transactional
    public boolean isCertificateUnlocked(Long userId, Long courseId) {
        Enrollment enrollment = enrollmentRepository.findByUserIdAndCourseId(userId, courseId).orElse(null);
        if (enrollment == null) {
            return false;
        }
        if (enrollment.isCompleted()) {
            return true;
        }
        Course course = enrollment.getCourse();
        if ("PRACTICE_TEST".equalsIgnoreCase(course.getType())) {
            return attemptRepository.existsByUserIdAndCourseIdAndPassedTrue(userId, courseId);
        }
        int progress = calculateProgress(userId, courseId);
        if (progress >= 100) {
            enrollment.setCompleted(true);
            enrollment.setCompletedAt(LocalDateTime.now());
            enrollmentRepository.save(enrollment);
            return true;
        }
        return false;
    }

    private int calculateProgress(Long userId, Long courseId) {
        List<Section> sections = sectionRepository.findByCourseIdOrderBySortOrderAsc(courseId);
        Map<Long, Integer> progressMap = progressTracker.getProgress(userId, courseId);

        int totalDuration = 0;
        double completedDuration = 0;
        int totalLecturesCount = 0;

        for (Section sec : sections) {
            List<Lecture> lectures = lectureRepository.findBySectionIdOrderBySortOrderAsc(sec.getId());
            for (Lecture lec : lectures) {
                totalLecturesCount++;
                int duration = lec.getDurationSec() != null ? lec.getDurationSec() : 0;
                int score = progressMap.getOrDefault(lec.getId(), 0);
                totalDuration += duration;
                completedDuration += ((double) score / 100.0) * duration;
            }
        }

        if (totalLecturesCount == 0) {
            Course course = courseRepository.findById(courseId).orElse(null);
            if (course != null) {
                String category = course.getCategory();
                long cId = courseId;
                long id101 = cId * 1000 + 101;
                long id102 = cId * 1000 + 102;
                long id201 = cId * 1000 + 201;
                long id202 = cId * 1000 + 202;
                
                int dur101, dur102, dur201, dur202;
                if ("AI & Data Science".equalsIgnoreCase(category)) {
                    dur101 = 320; dur102 = 640; dur201 = 720; dur202 = 960;
                } else if ("Finance & Trading".equalsIgnoreCase(category)) {
                    dur101 = 280; dur102 = 580; dur201 = 680; dur202 = 840;
                } else {
                    dur101 = 324; dur102 = 735; dur201 = 640; dur202 = 940;
                }
                
                long[] ids = {id101, id102, id201, id202};
                int[] durs = {dur101, dur102, dur201, dur202};
                
                int mockTotalDuration = 0;
                double mockCompletedDuration = 0;
                for (int i = 0; i < 4; i++) {
                    mockTotalDuration += durs[i];
                    int score = progressMap.getOrDefault(ids[i], 0);
                    mockCompletedDuration += ((double) score / 100.0) * durs[i];
                }
                
                if (mockTotalDuration == 0) return 0;
                return (int) Math.floor((mockCompletedDuration / mockTotalDuration) * 100.0);
            }
            return 0;
        }

        if (totalDuration == 0) {
            int completedCount = 0;
            for (Section sec : sections) {
                List<Lecture> lectures = lectureRepository.findBySectionIdOrderBySortOrderAsc(sec.getId());
                for (Lecture lec : lectures) {
                    int score = progressMap.getOrDefault(lec.getId(), 0);
                    if (score >= 90) {
                        completedCount++;
                    }
                }
            }
            return (int) Math.floor(((double) completedCount / totalLecturesCount) * 100.0);
        }

        return (int) Math.floor((completedDuration / totalDuration) * 100.0);
    }

    private String calculateSha256(String base) {
        try {
            MessageDigest digest = MessageDigest.getInstance("SHA-256");
            byte[] hash = digest.digest(base.getBytes("UTF-8"));
            StringBuilder hexString = new StringBuilder();
            for (byte b : hash) {
                String hex = Integer.toHexString(0xff & b);
                if (hex.length() == 1) hexString.append('0');
                hexString.append(hex);
            }
            return hexString.toString();
        } catch (Exception ex) {
            throw new RuntimeException(ex);
        }
    }
}
