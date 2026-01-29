


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE SCHEMA IF NOT EXISTS "clerk";


ALTER SCHEMA "clerk" OWNER TO "postgres";


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "wrappers" WITH SCHEMA "extensions";






CREATE TYPE "public"."document_category" AS ENUM (
    'primary_photo',
    'primary_non_photo',
    'secondary',
    'alternative'
);


ALTER TYPE "public"."document_category" OWNER TO "postgres";


CREATE TYPE "public"."document_type" AS ENUM (
    'passport',
    'drivers_license',
    'proof_of_age_card',
    'birth_certificate',
    'citizenship_certificate',
    'pension_card',
    'centrelink_card',
    'medicare_card',
    'bank_statement',
    'utility_bill',
    'council_rates',
    'government_notice',
    'credit_card_statement',
    'referee_statement',
    'expired_id',
    'immicard',
    'government_correspondence',
    'foreign_birth_certificate'
);


ALTER TYPE "public"."document_type" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."generate_investigation_number"() RETURNS character varying
    LANGUAGE "plpgsql"
    AS $$
DECLARE
    today_date TEXT;
    sequence_num TEXT;
    investigation_num VARCHAR(50);
BEGIN
    today_date := TO_CHAR(CURRENT_DATE, 'YYYYMMDD');

    -- Get next sequence number for today
    SELECT LPAD(
        (COUNT(*) + 1)::TEXT,
        4,
        '0'
    ) INTO sequence_num
    FROM edd_investigations
    WHERE investigation_number LIKE 'EDD-' || today_date || '-%';

    investigation_num := 'EDD-' || today_date || '-' || sequence_num;

    RETURN investigation_num;
END;
$$;


ALTER FUNCTION "public"."generate_investigation_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."set_investigation_number"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.investigation_number IS NULL OR NEW.investigation_number = '' THEN
        NEW.investigation_number := generate_investigation_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."set_investigation_number"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_investigation_activity"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.last_activity_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_investigation_activity"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_sanctioned_entities_search_vector"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.full_name || ' ' || 
    COALESCE(array_to_string(NEW.aliases, ' '), '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_sanctioned_entities_search_vector"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE FOREIGN DATA WRAPPER "wasm_wrapper" HANDLER "extensions"."wasm_fdw_handler" VALIDATOR "extensions"."wasm_fdw_validator";




CREATE SERVER "wasm_wrapper_server" FOREIGN DATA WRAPPER "wasm_wrapper" OPTIONS (
    "api_key_id" 'a4983822-8cec-4b5c-93bb-4a3b27e6bfcc',
    "api_url" 'https://api.clerk.com/',
    "fdw_package_checksum" '613be26b59fa4c074e0b93f0db617fcd7b468d4d02edece0b1f85fdb683ebdc4',
    "fdw_package_name" 'supabase:clerk-fdw',
    "fdw_package_url" 'https://github.com/supabase/wrappers/releases/download/wasm_clerk_fdw_v0.1.0/clerk_fdw.wasm',
    "fdw_package_version" '0.1.0'
);


ALTER SERVER "wasm_wrapper_server" OWNER TO "postgres";


CREATE FOREIGN TABLE "public"."Clerk_customer" (
    "username" "text",
    "attrs" "jsonb",
    "external_id" "text"
)
SERVER "wasm_wrapper_server"
OPTIONS (
    "object" 'users',
    "schema" 'public'
);


ALTER FOREIGN TABLE "public"."Clerk_customer" OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."audit_logs" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "action_type" character varying(100) NOT NULL,
    "entity_type" character varying(50),
    "entity_id" "uuid",
    "description" "text",
    "metadata" "jsonb",
    "ip_address" "inet",
    "user_agent" "text",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."audit_logs" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customer_documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "verification_id" "uuid",
    "document_category" "public"."document_category",
    "document_type" "public"."document_type",
    "storage_path" character varying(500) NOT NULL,
    "file_name" character varying(255),
    "file_size" integer,
    "mime_type" character varying(100),
    "uploaded_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone DEFAULT ("now"() + '7 years'::interval),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "review_status" character varying(20) DEFAULT 'pending'::character varying,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "rejection_reason" "text",
    "is_certified" boolean DEFAULT false,
    "certifier_name" character varying(255),
    "certifier_type" character varying(100),
    "certifier_registration_number" character varying(100),
    "certification_date" "date",
    "certification_statement" "text",
    "certification_validated" boolean DEFAULT false,
    "certification_validated_by" "uuid",
    "certification_validated_at" timestamp with time zone,
    CONSTRAINT "customer_documents_review_status_check" CHECK ((("review_status")::"text" = ANY ((ARRAY['pending'::character varying, 'approved'::character varying, 'rejected'::character varying, 'resubmission_required'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_documents" OWNER TO "postgres";


COMMENT ON COLUMN "public"."customer_documents"."is_certified" IS 'Whether document is certified by an authorized certifier';



COMMENT ON COLUMN "public"."customer_documents"."certifier_type" IS 'Type of authorized certifier: doctor, lawyer, jp, accountant, police_officer, pharmacist, teacher, engineer, nurse, minister';



COMMENT ON COLUMN "public"."customer_documents"."certification_validated" IS 'Whether admin has validated the certification details';



CREATE TABLE IF NOT EXISTS "public"."customer_edd" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "customer_id" "uuid",
    "source_of_wealth" character varying(100) NOT NULL,
    "source_of_wealth_details" "text",
    "transaction_purpose" character varying(100) NOT NULL,
    "transaction_purpose_details" "text",
    "expected_frequency" character varying(50) NOT NULL,
    "expected_annual_volume" character varying(50),
    "additional_documents" "jsonb",
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "reviewed_by" character varying(255),
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "submitted_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "escalated_to_management_at" timestamp with time zone,
    "requires_management_approval" boolean DEFAULT false,
    CONSTRAINT "customer_edd_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying, 'escalated'::character varying, 'approved'::character varying, 'rejected'::character varying])::"text"[])))
);


ALTER TABLE "public"."customer_edd" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."customers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "email" character varying(255) NOT NULL,
    "first_name" character varying(100),
    "middle_name" character varying(100),
    "last_name" character varying(100),
    "date_of_birth" "date",
    "residential_address" "jsonb",
    "phone" character varying(50),
    "verification_status" character varying(20) DEFAULT 'unverified'::character varying,
    "verification_level" character varying(20) DEFAULT 'none'::character varying,
    "stripe_customer_id" character varying(255),
    "risk_score" integer DEFAULT 0,
    "risk_level" character varying(20) DEFAULT 'low'::character varying,
    "is_pep" boolean DEFAULT false,
    "is_sanctioned" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "last_verified_at" timestamp with time zone,
    "clerk_user_id" "text" DEFAULT ("auth"."jwt"() ->> 'sub'::"text"),
    "source_of_funds" character varying(100),
    "source_of_funds_verified" boolean DEFAULT false,
    "source_of_funds_declared_at" timestamp with time zone,
    "occupation" character varying(100),
    "employer" character varying(255),
    "pep_relationship" character varying(50),
    "pep_declared_at" timestamp with time zone,
    "requires_enhanced_dd" boolean DEFAULT false,
    "edd_completed" boolean DEFAULT false,
    "edd_completed_at" timestamp with time zone,
    "last_transaction_reviewed_at" timestamp with time zone,
    "monitoring_level" character varying(20) DEFAULT 'standard'::character varying,
    "current_investigation_id" "uuid",
    "last_investigation_completed_at" timestamp with time zone,
    CONSTRAINT "customers_monitoring_level_check" CHECK ((("monitoring_level")::"text" = ANY ((ARRAY['standard'::character varying, 'ongoing_review'::character varying, 'enhanced'::character varying, 'blocked'::character varying])::"text"[]))),
    CONSTRAINT "customers_risk_level_check" CHECK ((("risk_level")::"text" = ANY ((ARRAY['low'::character varying, 'medium'::character varying, 'high'::character varying])::"text"[]))),
    CONSTRAINT "customers_risk_score_check" CHECK ((("risk_score" >= 0) AND ("risk_score" <= 100))),
    CONSTRAINT "customers_verification_level_check" CHECK ((("verification_level")::"text" = ANY ((ARRAY['none'::character varying, 'manual'::character varying, 'stripe_identity'::character varying, 'dvs_verified'::character varying])::"text"[]))),
    CONSTRAINT "customers_verification_status_check" CHECK ((("verification_status")::"text" = ANY ((ARRAY['unverified'::character varying, 'pending'::character varying, 'verified'::character varying, 'rejected'::character varying, 'requires_review'::character varying])::"text"[])))
);


ALTER TABLE "public"."customers" OWNER TO "postgres";


COMMENT ON COLUMN "public"."customers"."monitoring_level" IS 'Relationship-level compliance monitoring: standard (normal), ongoing_review (enhanced monitoring), enhanced (all transactions require review), blocked (no transactions allowed)';



COMMENT ON COLUMN "public"."customers"."current_investigation_id" IS 'References the active/most recent EDD investigation for this customer';



COMMENT ON COLUMN "public"."customers"."last_investigation_completed_at" IS 'Timestamp of most recent investigation completion';



CREATE SEQUENCE IF NOT EXISTS "public"."edd_investigation_sequence"
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


ALTER SEQUENCE "public"."edd_investigation_sequence" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."edd_investigations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid" NOT NULL,
    "transaction_id" "uuid",
    "customer_edd_id" "uuid",
    "investigation_number" character varying(50) NOT NULL,
    "status" character varying(30) DEFAULT 'open'::character varying,
    "triggered_by" character varying(20) NOT NULL,
    "triggered_by_admin_id" "uuid",
    "trigger_reason" "text" NOT NULL,
    "customer_information_review" "jsonb" DEFAULT '{"notes": null, "findings": null, "verified": false, "completed": false}'::"jsonb",
    "employment_verification" "jsonb" DEFAULT '{"employer": null, "position": null, "verified": false, "completed": false, "occupation": null, "length_of_employment": null}'::"jsonb",
    "source_of_wealth" "jsonb" DEFAULT '{"verified": false, "completed": false, "primary_source": null, "documentation_type": null, "documentation_verified": false}'::"jsonb",
    "source_of_funds" "jsonb" DEFAULT '{"verified": false, "completed": false, "funding_source": null, "supporting_documents": [], "bank_statements_verified": false}'::"jsonb",
    "transaction_pattern_analysis" "jsonb" DEFAULT '{"verified": false, "completed": false, "unusual_activity": false, "pattern_description": null, "compared_to_similar_customers": false}'::"jsonb",
    "additional_information" "jsonb" DEFAULT '{"completed": false, "information_received": [], "information_requested": []}'::"jsonb",
    "investigation_findings" "text",
    "risk_assessment_summary" "text",
    "compliance_recommendation" character varying(50),
    "information_requests" "jsonb" DEFAULT '[]'::"jsonb",
    "escalations" "jsonb" DEFAULT '[]'::"jsonb",
    "requires_management_approval" boolean DEFAULT true,
    "approved_by_management" boolean DEFAULT false,
    "management_approver_id" "uuid",
    "management_approved_at" timestamp with time zone,
    "assigned_to" "uuid",
    "primary_investigator_id" "uuid",
    "reviewed_by" "uuid",
    "opened_at" timestamp with time zone DEFAULT "now"(),
    "completed_at" timestamp with time zone,
    "last_activity_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "edd_investigations_compliance_recommendation_check" CHECK ((("compliance_recommendation")::"text" = ANY ((ARRAY['approve_relationship'::character varying, 'ongoing_monitoring'::character varying, 'enhanced_monitoring'::character varying, 'reject_relationship'::character varying, 'escalate_to_smr'::character varying, NULL::character varying])::"text"[]))),
    CONSTRAINT "edd_investigations_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['open'::character varying, 'awaiting_customer_info'::character varying, 'under_review'::character varying, 'escalated'::character varying, 'completed_approved'::character varying, 'completed_rejected'::character varying, 'completed_ongoing_monitoring'::character varying])::"text"[]))),
    CONSTRAINT "edd_investigations_triggered_by_check" CHECK ((("triggered_by")::"text" = ANY ((ARRAY['system'::character varying, 'admin'::character varying, 'transaction_review'::character varying])::"text"[])))
);


ALTER TABLE "public"."edd_investigations" OWNER TO "postgres";


COMMENT ON TABLE "public"."edd_investigations" IS 'Enhanced Due Diligence investigation tracking with full audit trail';



COMMENT ON COLUMN "public"."edd_investigations"."investigation_number" IS 'Auto-generated unique identifier (EDD-YYYYMMDD-XXXX format)';



COMMENT ON COLUMN "public"."edd_investigations"."status" IS 'Current status of the investigation workflow';



COMMENT ON COLUMN "public"."edd_investigations"."triggered_by" IS 'How the investigation was initiated (system auto-trigger, admin manual, or from transaction review)';



COMMENT ON COLUMN "public"."edd_investigations"."compliance_recommendation" IS 'Final compliance decision determining customer monitoring level';



COMMENT ON COLUMN "public"."edd_investigations"."requires_management_approval" IS 'Whether high-risk decisions (reject/SMR) require management sign-off';



CREATE TABLE IF NOT EXISTS "public"."enquiries" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255),
    "email" character varying(255),
    "phone" character varying(50),
    "message" "text"
);


ALTER TABLE "public"."enquiries" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."identity_verifications" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "stripe_verification_session_id" character varying(255),
    "verification_type" character varying(50) NOT NULL,
    "status" character varying(20) NOT NULL,
    "document_type" character varying(50),
    "document_number" character varying(100),
    "document_issuing_country" character varying(2),
    "document_expiry_date" "date",
    "verification_checks" "jsonb",
    "liveness_check_passed" boolean,
    "document_check_passed" boolean,
    "selfie_check_passed" boolean,
    "stripe_response" "jsonb",
    "verified_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "given_name" character varying(100),
    "family_name" character varying(100),
    "date_of_birth" "date",
    "address_line1" character varying(255),
    "address_line2" character varying(255),
    "address_city" character varying(100),
    "address_state" character varying(100),
    "address_postal_code" character varying(20),
    "address_country" character varying(2),
    "id_number_type" character varying(50),
    "id_number_country" character varying(2),
    "id_number_last4" character varying(4),
    "document_check_status" character varying(20),
    "selfie_check_status" character varying(20),
    "id_number_check_status" character varying(20),
    "id_number_check_passed" boolean
);


ALTER TABLE "public"."identity_verifications" OWNER TO "postgres";


COMMENT ON COLUMN "public"."identity_verifications"."given_name" IS 'First name from verified document';



COMMENT ON COLUMN "public"."identity_verifications"."family_name" IS 'Last name from verified document';



COMMENT ON COLUMN "public"."identity_verifications"."date_of_birth" IS 'Date of birth from verified document';



COMMENT ON COLUMN "public"."identity_verifications"."address_city" IS 'City from verified address';



COMMENT ON COLUMN "public"."identity_verifications"."id_number_type" IS 'Type of ID number (e.g., license_number, passport_number)';



COMMENT ON COLUMN "public"."identity_verifications"."id_number_last4" IS 'Last 4 digits of ID number';



CREATE TABLE IF NOT EXISTS "public"."price_locks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "session_id" character varying(255) NOT NULL,
    "product_id" "uuid",
    "locked_price" numeric(15,2) NOT NULL,
    "spot_price_per_gram" numeric(15,4),
    "metal_type" character varying(10),
    "locked_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone NOT NULL,
    "status" character varying(20) DEFAULT 'active'::character varying,
    "used_at" timestamp with time zone,
    "payment_intent_id" character varying(255),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "currency" character varying(3) DEFAULT 'AUD'::character varying NOT NULL,
    "locked_price_usd" numeric(15,2),
    "locked_price_aud" numeric(15,2),
    "fx_rate" numeric(10,6),
    CONSTRAINT "price_locks_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['active'::character varying, 'used'::character varying, 'expired'::character varying])::"text"[])))
);


ALTER TABLE "public"."price_locks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" character varying(255),
    "description" "text",
    "price" numeric(15,2),
    "currency" character varying(3),
    "weight" character varying(255),
    "category" character varying(255),
    "purity" character varying(255),
    "rating" character varying(255),
    "image_url" character varying(255),
    "stock" boolean,
    "metal_type" character varying(20) DEFAULT 'GOLD'::character varying,
    "price_per_gram" numeric(10,2),
    "weight_grams" numeric(10,3),
    "form_type" character varying(20),
    CONSTRAINT "chk_metal_type" CHECK ((("metal_type")::"text" = ANY ((ARRAY['XAU'::character varying, 'XAG'::character varying, 'XPT'::character varying, 'XPD'::character varying])::"text"[])))
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sanctioned_entities" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "full_name" character varying(255) NOT NULL,
    "aliases" "text"[],
    "date_of_birth" "date",
    "nationality" character varying(100),
    "entity_type" character varying(20),
    "source" character varying(50) NOT NULL,
    "reference_number" character varying(100),
    "listing_info" "text",
    "search_vector" "tsvector",
    "last_updated" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "sanctioned_entities_entity_type_check" CHECK ((("entity_type")::"text" = ANY ((ARRAY['individual'::character varying, 'entity'::character varying])::"text"[])))
);


ALTER TABLE "public"."sanctioned_entities" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."sanctions_screenings" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "screened_name" character varying(255) NOT NULL,
    "screening_service" character varying(50),
    "is_match" boolean DEFAULT false,
    "match_score" numeric(5,2),
    "matched_entities" "jsonb",
    "status" character varying(20) DEFAULT 'clear'::character varying,
    "reviewed_by" "uuid",
    "review_notes" "text",
    "screened_at" timestamp with time zone DEFAULT "now"(),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "screening_type" character varying(50) DEFAULT 'transaction'::character varying,
    CONSTRAINT "sanctions_screenings_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['clear'::character varying, 'potential_match'::character varying, 'confirmed_match'::character varying])::"text"[])))
);


ALTER TABLE "public"."sanctions_screenings" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "clerk_user_id" character varying,
    "full_name" character varying NOT NULL,
    "email" character varying NOT NULL,
    "position" character varying,
    "department" character varying,
    "employment_start_date" "date",
    "employment_end_date" "date",
    "is_active" boolean DEFAULT true,
    "requires_aml_training" boolean DEFAULT true,
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"(),
    "role" character varying,
    CONSTRAINT "staff_role_check" CHECK ((("role")::"text" = ANY ((ARRAY['admin'::character varying, 'manager'::character varying, 'staff'::character varying])::"text"[])))
);


ALTER TABLE "public"."staff" OWNER TO "postgres";


COMMENT ON TABLE "public"."staff" IS 'Staff registry for AML/CTF training compliance tracking';



COMMENT ON COLUMN "public"."staff"."requires_aml_training" IS 'Whether this staff member requires AML/CTF training based on their role';



CREATE TABLE IF NOT EXISTS "public"."staff_training" (
    "id" "uuid" DEFAULT "extensions"."uuid_generate_v4"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "training_type" character varying NOT NULL,
    "training_date" "date" NOT NULL,
    "training_provider" character varying,
    "topics_covered" "text"[],
    "duration_hours" numeric(4,2),
    "completion_status" character varying DEFAULT 'completed'::character varying,
    "pass_score" numeric(5,2),
    "certificate_url" character varying,
    "conducted_by" character varying,
    "next_training_due" "date",
    "notes" "text",
    "created_at" timestamp without time zone DEFAULT "now"(),
    "updated_at" timestamp without time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_training" OWNER TO "postgres";


COMMENT ON TABLE "public"."staff_training" IS 'Training records for AUSTRAC compliance - 7 year retention required';



COMMENT ON COLUMN "public"."staff_training"."next_training_due" IS 'Calculated date for next required training (typically annual refresher)';



CREATE TABLE IF NOT EXISTS "public"."suspicious_activity_reports" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "transaction_id" "uuid",
    "report_type" character varying(20) DEFAULT 'SMR'::character varying,
    "suspicion_category" character varying(100),
    "description" "text" NOT NULL,
    "status" character varying(20) DEFAULT 'pending'::character varying,
    "flagged_by_system" boolean DEFAULT true,
    "flagged_by_user" "uuid",
    "austrac_submitted_at" timestamp with time zone,
    "austrac_reference" character varying(100),
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "submission_deadline" timestamp with time zone,
    "transaction_amount_aud" numeric(15,2),
    "original_amount" numeric(15,2),
    "original_currency" character varying(3),
    "edd_investigation_id" "uuid",
    CONSTRAINT "suspicious_activity_reports_status_check" CHECK ((("status")::"text" = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying, 'reported'::character varying, 'dismissed'::character varying])::"text"[])))
);


ALTER TABLE "public"."suspicious_activity_reports" OWNER TO "postgres";


COMMENT ON COLUMN "public"."suspicious_activity_reports"."transaction_amount_aud" IS 'Transaction amount converted to AUD for compliance reporting';



COMMENT ON COLUMN "public"."suspicious_activity_reports"."original_amount" IS 'Original transaction amount before conversion';



COMMENT ON COLUMN "public"."suspicious_activity_reports"."original_currency" IS 'Original currency of the transaction (USD, AUD, etc)';



COMMENT ON COLUMN "public"."suspicious_activity_reports"."edd_investigation_id" IS 'Links SMR to EDD investigation if created as part of investigation escalation';



CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "transaction_type" character varying(50) NOT NULL,
    "amount" numeric(15,2) NOT NULL,
    "currency" character varying(3) DEFAULT 'AUD'::character varying,
    "product_type" character varying(100),
    "product_details" "jsonb",
    "stripe_payment_intent_id" character varying(255),
    "payment_method" character varying(50),
    "payment_status" character varying(20),
    "requires_kyc" boolean DEFAULT false,
    "requires_ttr" boolean DEFAULT false,
    "requires_enhanced_dd" boolean DEFAULT false,
    "ttr_generated_at" timestamp with time zone,
    "ttr_submitted_at" timestamp with time zone,
    "ttr_reference" character varying(100),
    "risk_flags" "jsonb",
    "flagged_for_review" boolean DEFAULT false,
    "reviewed_by" "uuid",
    "reviewed_at" timestamp with time zone,
    "review_notes" "text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "review_status" character varying(50),
    "source_of_funds_checked" boolean DEFAULT false,
    "source_of_funds_check_date" timestamp with time zone,
    "ttr_submission_deadline" timestamp with time zone,
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "amount_aud" numeric(10,2),
    "approved_at" timestamp with time zone,
    "payment_cardholder_name" character varying(255),
    "payment_name_mismatch" boolean DEFAULT false,
    "payment_name_mismatch_severity" character varying(20),
    "edd_investigation_id" "uuid",
    CONSTRAINT "transactions_payment_name_mismatch_severity_check" CHECK ((("payment_name_mismatch_severity")::"text" = ANY ((ARRAY['none'::character varying, 'low'::character varying, 'medium'::character varying, 'high'::character varying])::"text"[])))
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."transactions"."metadata" IS 'Stores additional transaction data including flag reasons, risk scores, and compliance details';



COMMENT ON COLUMN "public"."transactions"."amount_aud" IS 'Transaction amount converted to AUD for compliance threshold checks';



COMMENT ON COLUMN "public"."transactions"."approved_at" IS 'Timestamp when transaction was approved for payment (24-hour expiry)';



COMMENT ON COLUMN "public"."transactions"."payment_cardholder_name" IS 'Name on payment card from Stripe billing details';



COMMENT ON COLUMN "public"."transactions"."payment_name_mismatch" IS 'Whether payment card name differs from customer name';



COMMENT ON COLUMN "public"."transactions"."payment_name_mismatch_severity" IS 'Severity of name mismatch: none, low, medium, high';



COMMENT ON COLUMN "public"."transactions"."edd_investigation_id" IS 'Links transaction to EDD investigation if it triggered or is part of one';



CREATE TABLE IF NOT EXISTS "public"."verification_requirements" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "customer_id" "uuid",
    "verification_method" character varying(50),
    "is_complete" boolean DEFAULT false,
    "required_documents" "jsonb",
    "submitted_documents" "jsonb",
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."verification_requirements" OWNER TO "postgres";


ALTER TABLE ONLY "public"."audit_logs"
    ADD CONSTRAINT "audit_logs_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_edd"
    ADD CONSTRAINT "customer_edd_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_clerk_user_id_key" UNIQUE ("clerk_user_id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_email_key" UNIQUE ("email");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_investigation_number_key" UNIQUE ("investigation_number");



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."enquiries"
    ADD CONSTRAINT "enquiries_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."identity_verifications"
    ADD CONSTRAINT "identity_verifications_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."identity_verifications"
    ADD CONSTRAINT "identity_verifications_stripe_verification_session_id_key" UNIQUE ("stripe_verification_session_id");



ALTER TABLE ONLY "public"."price_locks"
    ADD CONSTRAINT "price_locks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sanctioned_entities"
    ADD CONSTRAINT "sanctioned_entities_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."sanctions_screenings"
    ADD CONSTRAINT "sanctions_screenings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_clerk_user_id_key" UNIQUE ("clerk_user_id");



ALTER TABLE ONLY "public"."staff"
    ADD CONSTRAINT "staff_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_training"
    ADD CONSTRAINT "staff_training_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."suspicious_activity_reports"
    ADD CONSTRAINT "suspicious_activity_reports_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."customer_edd"
    ADD CONSTRAINT "unique_customer_edd" UNIQUE ("customer_id");



ALTER TABLE ONLY "public"."verification_requirements"
    ADD CONSTRAINT "verification_requirements_pkey" PRIMARY KEY ("id");



CREATE INDEX "idx_audit_logs_created_at" ON "public"."audit_logs" USING "btree" ("created_at");



CREATE INDEX "idx_audit_logs_entity" ON "public"."audit_logs" USING "btree" ("entity_type", "entity_id");



CREATE INDEX "idx_customer_documents_certification" ON "public"."customer_documents" USING "btree" ("is_certified", "certification_validated");



CREATE INDEX "idx_customer_edd_status" ON "public"."customer_edd" USING "btree" ("status") WHERE (("status")::"text" = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying, 'escalated'::character varying])::"text"[]));



CREATE INDEX "idx_customers_clerk_user_id" ON "public"."customers" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_customers_current_investigation" ON "public"."customers" USING "btree" ("current_investigation_id");



CREATE INDEX "idx_customers_edd" ON "public"."customers" USING "btree" ("requires_enhanced_dd") WHERE ("requires_enhanced_dd" = true);



CREATE INDEX "idx_customers_email" ON "public"."customers" USING "btree" ("email");



CREATE INDEX "idx_customers_last_transaction_reviewed" ON "public"."customers" USING "btree" ("last_transaction_reviewed_at");



CREATE INDEX "idx_customers_monitoring_level" ON "public"."customers" USING "btree" ("monitoring_level");



CREATE INDEX "idx_customers_pep" ON "public"."customers" USING "btree" ("is_pep") WHERE ("is_pep" = true);



CREATE INDEX "idx_customers_source_of_funds" ON "public"."customers" USING "btree" ("source_of_funds_verified");



CREATE INDEX "idx_customers_verification_status" ON "public"."customers" USING "btree" ("verification_status");



CREATE INDEX "idx_edd_investigations_assigned_to" ON "public"."edd_investigations" USING "btree" ("assigned_to");



CREATE INDEX "idx_edd_investigations_customer_id" ON "public"."edd_investigations" USING "btree" ("customer_id");



CREATE INDEX "idx_edd_investigations_management_approver_id" ON "public"."edd_investigations" USING "btree" ("management_approver_id");



CREATE INDEX "idx_edd_investigations_number" ON "public"."edd_investigations" USING "btree" ("investigation_number");



CREATE INDEX "idx_edd_investigations_opened_at" ON "public"."edd_investigations" USING "btree" ("opened_at" DESC);



CREATE INDEX "idx_edd_investigations_primary_investigator_id" ON "public"."edd_investigations" USING "btree" ("primary_investigator_id");



CREATE INDEX "idx_edd_investigations_reviewed_by" ON "public"."edd_investigations" USING "btree" ("reviewed_by");



CREATE INDEX "idx_edd_investigations_status" ON "public"."edd_investigations" USING "btree" ("status");



CREATE INDEX "idx_edd_investigations_transaction_id" ON "public"."edd_investigations" USING "btree" ("transaction_id");



CREATE INDEX "idx_edd_investigations_triggered_by_admin_id" ON "public"."edd_investigations" USING "btree" ("triggered_by_admin_id");



CREATE INDEX "idx_identity_verifications_customer_id" ON "public"."identity_verifications" USING "btree" ("customer_id");



CREATE INDEX "idx_price_locks_customer" ON "public"."price_locks" USING "btree" ("customer_id", "status");



CREATE INDEX "idx_price_locks_session" ON "public"."price_locks" USING "btree" ("session_id", "status");



CREATE INDEX "idx_products_name" ON "public"."products" USING "btree" ("name");



CREATE INDEX "idx_sanctioned_entities_aliases" ON "public"."sanctioned_entities" USING "gin" ("aliases");



CREATE INDEX "idx_sanctioned_entities_dob" ON "public"."sanctioned_entities" USING "btree" ("date_of_birth");



CREATE INDEX "idx_sanctioned_entities_name_lower" ON "public"."sanctioned_entities" USING "btree" ("lower"(("full_name")::"text"));



CREATE INDEX "idx_sanctioned_entities_search" ON "public"."sanctioned_entities" USING "gin" ("search_vector");



CREATE INDEX "idx_sanctioned_entities_source" ON "public"."sanctioned_entities" USING "btree" ("source");



CREATE INDEX "idx_smr_deadline" ON "public"."suspicious_activity_reports" USING "btree" ("submission_deadline") WHERE (("status")::"text" = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying])::"text"[]));



CREATE INDEX "idx_smr_edd_investigation" ON "public"."suspicious_activity_reports" USING "btree" ("edd_investigation_id");



CREATE INDEX "idx_smr_transaction_amount" ON "public"."suspicious_activity_reports" USING "btree" ("transaction_amount_aud") WHERE ("transaction_amount_aud" IS NOT NULL);



CREATE INDEX "idx_staff_active" ON "public"."staff" USING "btree" ("is_active");



CREATE INDEX "idx_staff_clerk_user" ON "public"."staff" USING "btree" ("clerk_user_id");



CREATE INDEX "idx_staff_email" ON "public"."staff" USING "btree" ("email");



CREATE INDEX "idx_suspicious_reports_status" ON "public"."suspicious_activity_reports" USING "btree" ("status");



CREATE INDEX "idx_training_date" ON "public"."staff_training" USING "btree" ("training_date");



CREATE INDEX "idx_training_due" ON "public"."staff_training" USING "btree" ("next_training_due");



CREATE INDEX "idx_training_staff" ON "public"."staff_training" USING "btree" ("staff_id");



CREATE INDEX "idx_training_type" ON "public"."staff_training" USING "btree" ("training_type");



CREATE INDEX "idx_transactions_amount" ON "public"."transactions" USING "btree" ("amount");



CREATE INDEX "idx_transactions_amount_aud" ON "public"."transactions" USING "btree" ("amount_aud") WHERE ("amount_aud" >= (10000)::numeric);



CREATE INDEX "idx_transactions_approved_at" ON "public"."transactions" USING "btree" ("approved_at", "payment_status") WHERE (("approved_at" IS NOT NULL) AND (("payment_status")::"text" <> 'succeeded'::"text"));



CREATE INDEX "idx_transactions_created_at" ON "public"."transactions" USING "btree" ("created_at");



CREATE INDEX "idx_transactions_customer_id" ON "public"."transactions" USING "btree" ("customer_id");



CREATE INDEX "idx_transactions_edd_investigation" ON "public"."transactions" USING "btree" ("edd_investigation_id");



CREATE INDEX "idx_transactions_flagged" ON "public"."transactions" USING "btree" ("flagged_for_review");



CREATE INDEX "idx_transactions_metadata" ON "public"."transactions" USING "gin" ("metadata");



CREATE INDEX "idx_transactions_payment_name_mismatch" ON "public"."transactions" USING "btree" ("payment_name_mismatch", "payment_name_mismatch_severity") WHERE ("payment_name_mismatch" = true);



CREATE INDEX "idx_transactions_requires_ttr" ON "public"."transactions" USING "btree" ("requires_ttr");



CREATE INDEX "idx_transactions_review" ON "public"."transactions" USING "btree" ("flagged_for_review", "review_status") WHERE ("flagged_for_review" = true);



CREATE INDEX "idx_transactions_ttr_deadline" ON "public"."transactions" USING "btree" ("ttr_submission_deadline") WHERE (("requires_ttr" = true) AND ("ttr_submitted_at" IS NULL));



CREATE UNIQUE INDEX "idx_transactions_unique_payment_intent" ON "public"."transactions" USING "btree" ("stripe_payment_intent_id") WHERE (("stripe_payment_intent_id" IS NOT NULL) AND (("payment_status")::"text" <> 'duplicate'::"text"));



COMMENT ON INDEX "public"."idx_transactions_unique_payment_intent" IS 'Ensures each Stripe payment intent is associated with only one non-duplicate transaction';



CREATE OR REPLACE TRIGGER "trg_update_search_vector" BEFORE INSERT OR UPDATE ON "public"."sanctioned_entities" FOR EACH ROW EXECUTE FUNCTION "public"."update_sanctioned_entities_search_vector"();



CREATE OR REPLACE TRIGGER "trigger_set_investigation_number" BEFORE INSERT ON "public"."edd_investigations" FOR EACH ROW EXECUTE FUNCTION "public"."set_investigation_number"();



CREATE OR REPLACE TRIGGER "trigger_update_investigation_activity" BEFORE UPDATE ON "public"."edd_investigations" FOR EACH ROW EXECUTE FUNCTION "public"."update_investigation_activity"();



CREATE OR REPLACE TRIGGER "update_staff_training_updated_at" BEFORE UPDATE ON "public"."staff_training" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_staff_updated_at" BEFORE UPDATE ON "public"."staff" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_certification_validated_by_fkey" FOREIGN KEY ("certification_validated_by") REFERENCES "public"."staff"("id");



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."customer_documents"
    ADD CONSTRAINT "customer_documents_verification_id_fkey" FOREIGN KEY ("verification_id") REFERENCES "public"."identity_verifications"("id");



ALTER TABLE ONLY "public"."customer_edd"
    ADD CONSTRAINT "customer_edd_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."customers"
    ADD CONSTRAINT "customers_current_investigation_id_fkey" FOREIGN KEY ("current_investigation_id") REFERENCES "public"."edd_investigations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_assigned_to_fkey" FOREIGN KEY ("assigned_to") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_customer_edd_id_fkey" FOREIGN KEY ("customer_edd_id") REFERENCES "public"."customer_edd"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_management_approver_id_fkey" FOREIGN KEY ("management_approver_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_primary_investigator_id_fkey" FOREIGN KEY ("primary_investigator_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_reviewed_by_fkey" FOREIGN KEY ("reviewed_by") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."edd_investigations"
    ADD CONSTRAINT "edd_investigations_triggered_by_admin_id_fkey" FOREIGN KEY ("triggered_by_admin_id") REFERENCES "public"."staff"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."identity_verifications"
    ADD CONSTRAINT "identity_verifications_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."price_locks"
    ADD CONSTRAINT "price_locks_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."price_locks"
    ADD CONSTRAINT "price_locks_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."sanctions_screenings"
    ADD CONSTRAINT "sanctions_screenings_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_training"
    ADD CONSTRAINT "staff_training_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."staff"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."suspicious_activity_reports"
    ADD CONSTRAINT "suspicious_activity_reports_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id");



ALTER TABLE ONLY "public"."suspicious_activity_reports"
    ADD CONSTRAINT "suspicious_activity_reports_edd_investigation_id_fkey" FOREIGN KEY ("edd_investigation_id") REFERENCES "public"."edd_investigations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."suspicious_activity_reports"
    ADD CONSTRAINT "suspicious_activity_reports_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_edd_investigation_id_fkey" FOREIGN KEY ("edd_investigation_id") REFERENCES "public"."edd_investigations"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."verification_requirements"
    ADD CONSTRAINT "verification_requirements_customer_id_fkey" FOREIGN KEY ("customer_id") REFERENCES "public"."customers"("id") ON DELETE CASCADE;



CREATE POLICY "Customers can view own data" ON "public"."customers" FOR SELECT USING (("clerk_user_id" = ("auth"."jwt"() ->> 'sub'::"text")));



ALTER TABLE "public"."customer_documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."customers" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."identity_verifications" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."suspicious_activity_reports" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."customers";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."products";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";
































































































































































































































































































GRANT ALL ON FUNCTION "public"."generate_investigation_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."generate_investigation_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."generate_investigation_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."set_investigation_number"() TO "anon";
GRANT ALL ON FUNCTION "public"."set_investigation_number"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."set_investigation_number"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_investigation_activity"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_investigation_activity"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_investigation_activity"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_sanctioned_entities_search_vector"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_sanctioned_entities_search_vector"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_sanctioned_entities_search_vector"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";





















GRANT ALL ON TABLE "public"."Clerk_customer" TO "anon";
GRANT ALL ON TABLE "public"."Clerk_customer" TO "authenticated";
GRANT ALL ON TABLE "public"."Clerk_customer" TO "service_role";



GRANT ALL ON TABLE "public"."audit_logs" TO "anon";
GRANT ALL ON TABLE "public"."audit_logs" TO "authenticated";
GRANT ALL ON TABLE "public"."audit_logs" TO "service_role";



GRANT ALL ON TABLE "public"."customer_documents" TO "anon";
GRANT ALL ON TABLE "public"."customer_documents" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_documents" TO "service_role";



GRANT ALL ON TABLE "public"."customer_edd" TO "anon";
GRANT ALL ON TABLE "public"."customer_edd" TO "authenticated";
GRANT ALL ON TABLE "public"."customer_edd" TO "service_role";



GRANT ALL ON TABLE "public"."customers" TO "anon";
GRANT ALL ON TABLE "public"."customers" TO "authenticated";
GRANT ALL ON TABLE "public"."customers" TO "service_role";



GRANT ALL ON SEQUENCE "public"."edd_investigation_sequence" TO "anon";
GRANT ALL ON SEQUENCE "public"."edd_investigation_sequence" TO "authenticated";
GRANT ALL ON SEQUENCE "public"."edd_investigation_sequence" TO "service_role";



GRANT ALL ON TABLE "public"."edd_investigations" TO "anon";
GRANT ALL ON TABLE "public"."edd_investigations" TO "authenticated";
GRANT ALL ON TABLE "public"."edd_investigations" TO "service_role";



GRANT ALL ON TABLE "public"."enquiries" TO "anon";
GRANT ALL ON TABLE "public"."enquiries" TO "authenticated";
GRANT ALL ON TABLE "public"."enquiries" TO "service_role";



GRANT ALL ON TABLE "public"."identity_verifications" TO "anon";
GRANT ALL ON TABLE "public"."identity_verifications" TO "authenticated";
GRANT ALL ON TABLE "public"."identity_verifications" TO "service_role";



GRANT ALL ON TABLE "public"."price_locks" TO "anon";
GRANT ALL ON TABLE "public"."price_locks" TO "authenticated";
GRANT ALL ON TABLE "public"."price_locks" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."sanctioned_entities" TO "anon";
GRANT ALL ON TABLE "public"."sanctioned_entities" TO "authenticated";
GRANT ALL ON TABLE "public"."sanctioned_entities" TO "service_role";



GRANT ALL ON TABLE "public"."sanctions_screenings" TO "anon";
GRANT ALL ON TABLE "public"."sanctions_screenings" TO "authenticated";
GRANT ALL ON TABLE "public"."sanctions_screenings" TO "service_role";



GRANT ALL ON TABLE "public"."staff" TO "anon";
GRANT ALL ON TABLE "public"."staff" TO "authenticated";
GRANT ALL ON TABLE "public"."staff" TO "service_role";



GRANT ALL ON TABLE "public"."staff_training" TO "anon";
GRANT ALL ON TABLE "public"."staff_training" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_training" TO "service_role";



GRANT ALL ON TABLE "public"."suspicious_activity_reports" TO "anon";
GRANT ALL ON TABLE "public"."suspicious_activity_reports" TO "authenticated";
GRANT ALL ON TABLE "public"."suspicious_activity_reports" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."verification_requirements" TO "anon";
GRANT ALL ON TABLE "public"."verification_requirements" TO "authenticated";
GRANT ALL ON TABLE "public"."verification_requirements" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































