-- Dev Branch: Functions, Constraints, Indexes, Triggers
-- Run in this order: Functions first, then constraints/indexes, then triggers
-- Mon Dec 29 15:01:27 AEDT 2025

-- ================================
-- 1. FUNCTIONS (must be created first)
-- ================================

CREATE FUNCTION public.generate_investigation_number() RETURNS character varying
    LANGUAGE plpgsql
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



CREATE FUNCTION public.set_investigation_number() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    IF NEW.investigation_number IS NULL OR NEW.investigation_number = '' THEN
        NEW.investigation_number := generate_investigation_number();
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.set_investigation_number() OWNER TO postgres;

--
-- Name: update_investigation_activity(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE FUNCTION public.update_investigation_activity() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.last_activity_at := NOW();
    NEW.updated_at := NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_investigation_activity() OWNER TO postgres;

--
-- Name: update_sanctioned_entities_search_vector(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE FUNCTION public.update_sanctioned_entities_search_vector() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
  NEW.search_vector := to_tsvector('english', 
    NEW.full_name || ' ' || 
    COALESCE(array_to_string(NEW.aliases, ' '), '')
  );
  RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_sanctioned_entities_search_vector() OWNER TO postgres;

--
-- Name: update_updated_at_column(); Type: FUNCTION; Schema: public; Owner: postgres

CREATE FUNCTION public.update_updated_at_column() RETURNS trigger
    LANGUAGE plpgsql
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION public.update_updated_at_column() OWNER TO postgres;

--

-- ================================
-- 2. CONSTRAINTS
-- ================================
ALTER TABLE ONLY public.audit_logs
    ADD CONSTRAINT audit_logs_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT customer_documents_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customer_edd
    ADD CONSTRAINT customer_edd_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_clerk_user_id_key UNIQUE (clerk_user_id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_email_key UNIQUE (email);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_investigation_number_key UNIQUE (investigation_number);

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.enquiries
    ADD CONSTRAINT enquiries_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_stripe_verification_session_id_key UNIQUE (stripe_verification_session_id);

ALTER TABLE ONLY public.price_locks
    ADD CONSTRAINT price_locks_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.products
    ADD CONSTRAINT products_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sanctioned_entities
    ADD CONSTRAINT sanctioned_entities_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.sanctions_screenings
    ADD CONSTRAINT sanctions_screenings_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_clerk_user_id_key UNIQUE (clerk_user_id);

ALTER TABLE ONLY public.staff
    ADD CONSTRAINT staff_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.staff_training
    ADD CONSTRAINT staff_training_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.suspicious_activity_reports
    ADD CONSTRAINT suspicious_activity_reports_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customer_edd
    ADD CONSTRAINT unique_customer_edd UNIQUE (customer_id);

ALTER TABLE ONLY public.verification_requirements
    ADD CONSTRAINT verification_requirements_pkey PRIMARY KEY (id);

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT customer_documents_certification_validated_by_fkey FOREIGN KEY (certification_validated_by) REFERENCES public.staff(id);

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT customer_documents_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.customer_documents
    ADD CONSTRAINT customer_documents_verification_id_fkey FOREIGN KEY (verification_id) REFERENCES public.identity_verifications(id);

ALTER TABLE ONLY public.customer_edd
    ADD CONSTRAINT customer_edd_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.customers
    ADD CONSTRAINT customers_current_investigation_id_fkey FOREIGN KEY (current_investigation_id) REFERENCES public.edd_investigations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_assigned_to_fkey FOREIGN KEY (assigned_to) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_customer_edd_id_fkey FOREIGN KEY (customer_edd_id) REFERENCES public.customer_edd(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_management_approver_id_fkey FOREIGN KEY (management_approver_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_primary_investigator_id_fkey FOREIGN KEY (primary_investigator_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_reviewed_by_fkey FOREIGN KEY (reviewed_by) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.edd_investigations
    ADD CONSTRAINT edd_investigations_triggered_by_admin_id_fkey FOREIGN KEY (triggered_by_admin_id) REFERENCES public.staff(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.identity_verifications
    ADD CONSTRAINT identity_verifications_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.price_locks
    ADD CONSTRAINT price_locks_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.price_locks
    ADD CONSTRAINT price_locks_product_id_fkey FOREIGN KEY (product_id) REFERENCES public.products(id);

ALTER TABLE ONLY public.sanctions_screenings
    ADD CONSTRAINT sanctions_screenings_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.staff_training
    ADD CONSTRAINT staff_training_staff_id_fkey FOREIGN KEY (staff_id) REFERENCES public.staff(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.suspicious_activity_reports
    ADD CONSTRAINT suspicious_activity_reports_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id);

ALTER TABLE ONLY public.suspicious_activity_reports
    ADD CONSTRAINT suspicious_activity_reports_edd_investigation_id_fkey FOREIGN KEY (edd_investigation_id) REFERENCES public.edd_investigations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.suspicious_activity_reports
    ADD CONSTRAINT suspicious_activity_reports_transaction_id_fkey FOREIGN KEY (transaction_id) REFERENCES public.transactions(id);

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;

ALTER TABLE ONLY public.transactions
    ADD CONSTRAINT transactions_edd_investigation_id_fkey FOREIGN KEY (edd_investigation_id) REFERENCES public.edd_investigations(id) ON DELETE SET NULL;

ALTER TABLE ONLY public.verification_requirements
    ADD CONSTRAINT verification_requirements_customer_id_fkey FOREIGN KEY (customer_id) REFERENCES public.customers(id) ON DELETE CASCADE;


-- ================================
-- 3. INDEXES
-- ================================
CREATE INDEX idx_audit_logs_created_at ON public.audit_logs USING btree (created_at);
CREATE INDEX idx_audit_logs_entity ON public.audit_logs USING btree (entity_type, entity_id);
CREATE INDEX idx_customer_documents_certification ON public.customer_documents USING btree (is_certified, certification_validated);
CREATE INDEX idx_customer_edd_status ON public.customer_edd USING btree (status) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying, 'escalated'::character varying])::text[]));
CREATE INDEX idx_customers_clerk_user_id ON public.customers USING btree (clerk_user_id);
CREATE INDEX idx_customers_current_investigation ON public.customers USING btree (current_investigation_id);
CREATE INDEX idx_customers_edd ON public.customers USING btree (requires_enhanced_dd) WHERE (requires_enhanced_dd = true);
CREATE INDEX idx_customers_email ON public.customers USING btree (email);
CREATE INDEX idx_customers_last_transaction_reviewed ON public.customers USING btree (last_transaction_reviewed_at);
CREATE INDEX idx_customers_monitoring_level ON public.customers USING btree (monitoring_level);
CREATE INDEX idx_customers_pep ON public.customers USING btree (is_pep) WHERE (is_pep = true);
CREATE INDEX idx_customers_source_of_funds ON public.customers USING btree (source_of_funds_verified);
CREATE INDEX idx_customers_verification_status ON public.customers USING btree (verification_status);
CREATE INDEX idx_edd_investigations_assigned_to ON public.edd_investigations USING btree (assigned_to);
CREATE INDEX idx_edd_investigations_customer_id ON public.edd_investigations USING btree (customer_id);
CREATE INDEX idx_edd_investigations_management_approver_id ON public.edd_investigations USING btree (management_approver_id);
CREATE INDEX idx_edd_investigations_number ON public.edd_investigations USING btree (investigation_number);
CREATE INDEX idx_edd_investigations_opened_at ON public.edd_investigations USING btree (opened_at DESC);
CREATE INDEX idx_edd_investigations_primary_investigator_id ON public.edd_investigations USING btree (primary_investigator_id);
CREATE INDEX idx_edd_investigations_reviewed_by ON public.edd_investigations USING btree (reviewed_by);
CREATE INDEX idx_edd_investigations_status ON public.edd_investigations USING btree (status);
CREATE INDEX idx_edd_investigations_transaction_id ON public.edd_investigations USING btree (transaction_id);
CREATE INDEX idx_edd_investigations_triggered_by_admin_id ON public.edd_investigations USING btree (triggered_by_admin_id);
CREATE INDEX idx_identity_verifications_customer_id ON public.identity_verifications USING btree (customer_id);
CREATE INDEX idx_price_locks_customer ON public.price_locks USING btree (customer_id, status);
CREATE INDEX idx_price_locks_session ON public.price_locks USING btree (session_id, status);
CREATE INDEX idx_products_name ON public.products USING btree (name);
CREATE INDEX idx_sanctioned_entities_aliases ON public.sanctioned_entities USING gin (aliases);
CREATE INDEX idx_sanctioned_entities_dob ON public.sanctioned_entities USING btree (date_of_birth);
CREATE INDEX idx_sanctioned_entities_name_lower ON public.sanctioned_entities USING btree (lower((full_name)::text));
CREATE INDEX idx_sanctioned_entities_search ON public.sanctioned_entities USING gin (search_vector);
CREATE INDEX idx_sanctioned_entities_source ON public.sanctioned_entities USING btree (source);
CREATE INDEX idx_smr_deadline ON public.suspicious_activity_reports USING btree (submission_deadline) WHERE ((status)::text = ANY ((ARRAY['pending'::character varying, 'under_review'::character varying])::text[]));
CREATE INDEX idx_smr_edd_investigation ON public.suspicious_activity_reports USING btree (edd_investigation_id);
CREATE INDEX idx_smr_transaction_amount ON public.suspicious_activity_reports USING btree (transaction_amount_aud) WHERE (transaction_amount_aud IS NOT NULL);
CREATE INDEX idx_staff_active ON public.staff USING btree (is_active);
CREATE INDEX idx_staff_clerk_user ON public.staff USING btree (clerk_user_id);
CREATE INDEX idx_staff_email ON public.staff USING btree (email);
CREATE INDEX idx_suspicious_reports_status ON public.suspicious_activity_reports USING btree (status);
CREATE INDEX idx_training_date ON public.staff_training USING btree (training_date);
CREATE INDEX idx_training_due ON public.staff_training USING btree (next_training_due);
CREATE INDEX idx_training_staff ON public.staff_training USING btree (staff_id);
CREATE INDEX idx_training_type ON public.staff_training USING btree (training_type);
CREATE INDEX idx_transactions_amount ON public.transactions USING btree (amount);
CREATE INDEX idx_transactions_amount_aud ON public.transactions USING btree (amount_aud) WHERE (amount_aud >= (10000)::numeric);
CREATE INDEX idx_transactions_approved_at ON public.transactions USING btree (approved_at, payment_status) WHERE ((approved_at IS NOT NULL) AND ((payment_status)::text <> 'succeeded'::text));
CREATE INDEX idx_transactions_created_at ON public.transactions USING btree (created_at);
CREATE INDEX idx_transactions_customer_id ON public.transactions USING btree (customer_id);
CREATE INDEX idx_transactions_edd_investigation ON public.transactions USING btree (edd_investigation_id);
CREATE INDEX idx_transactions_flagged ON public.transactions USING btree (flagged_for_review);
CREATE INDEX idx_transactions_metadata ON public.transactions USING gin (metadata);
CREATE INDEX idx_transactions_payment_name_mismatch ON public.transactions USING btree (payment_name_mismatch, payment_name_mismatch_severity) WHERE (payment_name_mismatch = true);
CREATE INDEX idx_transactions_requires_ttr ON public.transactions USING btree (requires_ttr);
CREATE INDEX idx_transactions_review ON public.transactions USING btree (flagged_for_review, review_status) WHERE (flagged_for_review = true);
CREATE INDEX idx_transactions_ttr_deadline ON public.transactions USING btree (ttr_submission_deadline) WHERE ((requires_ttr = true) AND (ttr_submitted_at IS NULL));
CREATE UNIQUE INDEX idx_transactions_unique_payment_intent ON public.transactions USING btree (stripe_payment_intent_id) WHERE ((stripe_payment_intent_id IS NOT NULL) AND ((payment_status)::text <> 'duplicate'::text));

-- ================================
-- 4. TRIGGERS (must be created last)
-- ================================
CREATE TRIGGER trg_update_search_vector BEFORE INSERT OR UPDATE ON public.sanctioned_entities FOR EACH ROW EXECUTE FUNCTION public.update_sanctioned_entities_search_vector();
CREATE TRIGGER trigger_set_investigation_number BEFORE INSERT ON public.edd_investigations FOR EACH ROW EXECUTE FUNCTION public.set_investigation_number();
CREATE TRIGGER trigger_update_investigation_activity BEFORE UPDATE ON public.edd_investigations FOR EACH ROW EXECUTE FUNCTION public.update_investigation_activity();
CREATE TRIGGER update_staff_training_updated_at BEFORE UPDATE ON public.staff_training FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
CREATE TRIGGER update_staff_updated_at BEFORE UPDATE ON public.staff FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();
