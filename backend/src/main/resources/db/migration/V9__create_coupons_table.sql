CREATE TABLE coupons (
    id BIGSERIAL PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    discount_type VARCHAR(20) NOT NULL DEFAULT 'PERCENTAGE',
    value NUMERIC(10, 2) NOT NULL,
    course_id BIGINT,
    max_uses INT NOT NULL DEFAULT 100,
    used_count INT NOT NULL DEFAULT 0,
    min_order_amount NUMERIC(10, 2) DEFAULT 0,
    expires_at TIMESTAMP,
    created_at TIMESTAMP NOT NULL DEFAULT NOW(),
    CONSTRAINT uq_coupon_code UNIQUE (code),
    CONSTRAINT fk_coupon_course FOREIGN KEY (course_id) REFERENCES courses(id) ON DELETE SET NULL
);

-- Seed some default demo coupons
INSERT INTO coupons (code, discount_type, value, course_id, max_uses, used_count, expires_at) VALUES
    ('WELCOME20', 'PERCENTAGE', 20.00, NULL, 500, 0, '2027-12-31 23:59:59'),
    ('SUMMER50', 'PERCENTAGE', 50.00, NULL, 200, 0, '2027-08-31 23:59:59'),
    ('FLAT100', 'FIXED_AMOUNT', 100.00, NULL, 300, 0, '2027-12-31 23:59:59'),
    ('EDUFLOW10', 'PERCENTAGE', 10.00, NULL, 1000, 0, '2027-12-31 23:59:59');
