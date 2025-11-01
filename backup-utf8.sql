--
-- PostgreSQL database cluster dump
--

\restrict pItgPbm5burNUvyVwYXwLknwTOpCXy8sCPuabiCaCzY1SjyWXubPxj2eQDcysAV

SET default_transaction_read_only = off;

SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;

--
-- Drop databases (except postgres and template1)
--





--
-- Drop roles
--

DROP ROLE postgres;


--
-- Roles
--

CREATE ROLE postgres;
ALTER ROLE postgres WITH SUPERUSER INHERIT CREATEROLE CREATEDB LOGIN REPLICATION BYPASSRLS PASSWORD 'SCRAM-SHA-256$4096:uxYXa3n5wGbSr5GMigThcg==$wAYxBiJnaJdEy4pGrwsJpMkCc2HcT5AvF2+HVyMZrrg=:J5XJueKBh6RAkpcvXS10FJY+ERogotEZiu2B8yVSOFw=';

--
-- User Configurations
--








\unrestrict pItgPbm5burNUvyVwYXwLknwTOpCXy8sCPuabiCaCzY1SjyWXubPxj2eQDcysAV

--
-- Databases
--

--
-- Database "template1" dump
--

--
-- PostgreSQL database dump
--

\restrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

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

UPDATE pg_catalog.pg_database SET datistemplate = false WHERE datname = 'template1';
DROP DATABASE template1;
--
-- Name: template1; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE template1 WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE template1 OWNER TO postgres;

\unrestrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX
\connect template1
\restrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX

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

--
-- Name: DATABASE template1; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE template1 IS 'default template for new databases';


--
-- Name: template1; Type: DATABASE PROPERTIES; Schema: -; Owner: postgres
--

ALTER DATABASE template1 IS_TEMPLATE = true;


\unrestrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX
\connect template1
\restrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX

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

--
-- Name: DATABASE template1; Type: ACL; Schema: -; Owner: postgres
--

REVOKE CONNECT,TEMPORARY ON DATABASE template1 FROM PUBLIC;
GRANT CONNECT ON DATABASE template1 TO PUBLIC;


--
-- PostgreSQL database dump complete
--

\unrestrict kfI8pWeTTB1iPefjGhYpCXsSAt9sBLDiYtdlGYTSGZcu4FzvJtaqCr9HldaFIcX

--
-- Database "postgres" dump
--

--
-- PostgreSQL database dump
--

\restrict nNeHLxVk7oPaADEvVksSQ50mc7fsGPR06ICG0GwlrlhBR2k5Hdu5C5CBw9qv2JD

-- Dumped from database version 15.14 (Debian 15.14-1.pgdg13+1)
-- Dumped by pg_dump version 15.14 (Debian 15.14-1.pgdg13+1)

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

DROP DATABASE postgres;
--
-- Name: postgres; Type: DATABASE; Schema: -; Owner: postgres
--

CREATE DATABASE postgres WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en_US.utf8';


ALTER DATABASE postgres OWNER TO postgres;

\unrestrict nNeHLxVk7oPaADEvVksSQ50mc7fsGPR06ICG0GwlrlhBR2k5Hdu5C5CBw9qv2JD
\connect postgres
\restrict nNeHLxVk7oPaADEvVksSQ50mc7fsGPR06ICG0GwlrlhBR2k5Hdu5C5CBw9qv2JD

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

--
-- Name: DATABASE postgres; Type: COMMENT; Schema: -; Owner: postgres
--

COMMENT ON DATABASE postgres IS 'default administrative connection database';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: auth_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group (
    id integer NOT NULL,
    name character varying(150) NOT NULL
);


ALTER TABLE public.auth_group OWNER TO postgres;

--
-- Name: auth_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_group_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_group_permissions (
    id bigint NOT NULL,
    group_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_group_permissions OWNER TO postgres;

--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_group_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_group_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_permission; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_permission (
    id integer NOT NULL,
    name character varying(255) NOT NULL,
    content_type_id integer NOT NULL,
    codename character varying(100) NOT NULL
);


ALTER TABLE public.auth_permission OWNER TO postgres;

--
-- Name: auth_permission_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_permission ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_permission_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user (
    id integer NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.auth_user OWNER TO postgres;

--
-- Name: auth_user_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_groups (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.auth_user_groups OWNER TO postgres;

--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: auth_user_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.auth_user_user_permissions (
    id bigint NOT NULL,
    user_id integer NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.auth_user_user_permissions OWNER TO postgres;

--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.auth_user_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.auth_user_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_admin_log; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_admin_log (
    id integer NOT NULL,
    action_time timestamp with time zone NOT NULL,
    object_id text,
    object_repr character varying(200) NOT NULL,
    action_flag smallint NOT NULL,
    change_message text NOT NULL,
    content_type_id integer,
    user_id integer NOT NULL,
    CONSTRAINT django_admin_log_action_flag_check CHECK ((action_flag >= 0))
);


ALTER TABLE public.django_admin_log OWNER TO postgres;

--
-- Name: django_admin_log_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_admin_log ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_admin_log_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_content_type; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_content_type (
    id integer NOT NULL,
    app_label character varying(100) NOT NULL,
    model character varying(100) NOT NULL
);


ALTER TABLE public.django_content_type OWNER TO postgres;

--
-- Name: django_content_type_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_content_type ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_content_type_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_migrations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_migrations (
    id bigint NOT NULL,
    app character varying(255) NOT NULL,
    name character varying(255) NOT NULL,
    applied timestamp with time zone NOT NULL
);


ALTER TABLE public.django_migrations OWNER TO postgres;

--
-- Name: django_migrations_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.django_migrations ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.django_migrations_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: django_session; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.django_session (
    session_key character varying(40) NOT NULL,
    session_data text NOT NULL,
    expire_date timestamp with time zone NOT NULL
);


ALTER TABLE public.django_session OWNER TO postgres;

--
-- Name: main_article; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_article (
    id bigint NOT NULL,
    title character varying(255) NOT NULL,
    content text NOT NULL,
    pdf_file character varying(100) NOT NULL,
    created_at timestamp with time zone NOT NULL,
    added_by_id integer NOT NULL
);


ALTER TABLE public.main_article OWNER TO postgres;

--
-- Name: main_article_authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_article_authors (
    id bigint NOT NULL,
    article_id bigint NOT NULL,
    author_id bigint NOT NULL
);


ALTER TABLE public.main_article_authors OWNER TO postgres;

--
-- Name: main_article_authors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_article_authors ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_article_authors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_article_categories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_article_categories (
    id bigint NOT NULL,
    article_id bigint NOT NULL,
    category_id bigint NOT NULL
);


ALTER TABLE public.main_article_categories OWNER TO postgres;

--
-- Name: main_article_categories_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_article_categories ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_article_categories_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_article_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_article ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_article_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_article_keywords; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_article_keywords (
    id bigint NOT NULL,
    article_id bigint NOT NULL,
    keyword_id bigint NOT NULL
);


ALTER TABLE public.main_article_keywords OWNER TO postgres;

--
-- Name: main_article_keywords_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_article_keywords ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_article_keywords_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_articlelike; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_articlelike (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    article_id bigint NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.main_articlelike OWNER TO postgres;

--
-- Name: main_articlelike_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_articlelike ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_articlelike_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_articlemetadata; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_articlemetadata (
    id bigint NOT NULL,
    title character varying(255),
    subject character varying(255),
    "creationDate" character varying(255),
    keywords text,
    creator character varying(255),
    doi character varying(255),
    article_id bigint NOT NULL
);


ALTER TABLE public.main_articlemetadata OWNER TO postgres;

--
-- Name: main_articlemetadata_authors; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_articlemetadata_authors (
    id bigint NOT NULL,
    articlemetadata_id bigint NOT NULL,
    author_id bigint NOT NULL
);


ALTER TABLE public.main_articlemetadata_authors OWNER TO postgres;

--
-- Name: main_articlemetadata_authors_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_articlemetadata_authors ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_articlemetadata_authors_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_articlemetadata_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_articlemetadata ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_articlemetadata_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_author; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_author (
    id bigint NOT NULL,
    name character varying(255) NOT NULL
);


ALTER TABLE public.main_author OWNER TO postgres;

--
-- Name: main_author_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_author ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_author_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_category; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_category (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    description text NOT NULL
);


ALTER TABLE public.main_category OWNER TO postgres;

--
-- Name: main_category_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_category ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_category_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_customuser; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_customuser (
    id bigint NOT NULL,
    password character varying(128) NOT NULL,
    last_login timestamp with time zone,
    is_superuser boolean NOT NULL,
    username character varying(150) NOT NULL,
    first_name character varying(150) NOT NULL,
    last_name character varying(150) NOT NULL,
    email character varying(254) NOT NULL,
    is_staff boolean NOT NULL,
    is_active boolean NOT NULL,
    date_joined timestamp with time zone NOT NULL
);


ALTER TABLE public.main_customuser OWNER TO postgres;

--
-- Name: main_customuser_groups; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_customuser_groups (
    id bigint NOT NULL,
    customuser_id bigint NOT NULL,
    group_id integer NOT NULL
);


ALTER TABLE public.main_customuser_groups OWNER TO postgres;

--
-- Name: main_customuser_groups_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_customuser_groups ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_customuser_groups_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_customuser_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_customuser ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_customuser_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_customuser_user_permissions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_customuser_user_permissions (
    id bigint NOT NULL,
    customuser_id bigint NOT NULL,
    permission_id integer NOT NULL
);


ALTER TABLE public.main_customuser_user_permissions OWNER TO postgres;

--
-- Name: main_customuser_user_permissions_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_customuser_user_permissions ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_customuser_user_permissions_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_group; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_group (
    id bigint NOT NULL,
    name character varying(100) NOT NULL,
    admin_id integer
);


ALTER TABLE public.main_group OWNER TO postgres;

--
-- Name: main_group_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_group ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_group_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_group_members; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_group_members (
    id bigint NOT NULL,
    group_id bigint NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.main_group_members OWNER TO postgres;

--
-- Name: main_group_members_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_group_members ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_group_members_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_grouparticlelike; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_grouparticlelike (
    id bigint NOT NULL,
    created_at timestamp with time zone NOT NULL,
    article_id bigint NOT NULL,
    group_id bigint NOT NULL
);


ALTER TABLE public.main_grouparticlelike OWNER TO postgres;

--
-- Name: main_grouparticlelike_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_grouparticlelike ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_grouparticlelike_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_groupinvite; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_groupinvite (
    id bigint NOT NULL,
    accepted boolean NOT NULL,
    group_id bigint NOT NULL,
    invited_user_id integer NOT NULL,
    sender_id integer NOT NULL
);


ALTER TABLE public.main_groupinvite OWNER TO postgres;

--
-- Name: main_groupinvite_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_groupinvite ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_groupinvite_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_keyword; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_keyword (
    id bigint NOT NULL,
    keyword character varying(100) NOT NULL
);


ALTER TABLE public.main_keyword OWNER TO postgres;

--
-- Name: main_keyword_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_keyword ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_keyword_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_tag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_tag (
    id bigint NOT NULL,
    name character varying(100) NOT NULL
);


ALTER TABLE public.main_tag OWNER TO postgres;

--
-- Name: main_tag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_tag ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_tag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Name: main_userarticletag; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.main_userarticletag (
    id bigint NOT NULL,
    is_public boolean NOT NULL,
    article_id bigint NOT NULL,
    tag_id bigint NOT NULL,
    user_id integer NOT NULL
);


ALTER TABLE public.main_userarticletag OWNER TO postgres;

--
-- Name: main_userarticletag_id_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.main_userarticletag ALTER COLUMN id ADD GENERATED BY DEFAULT AS IDENTITY (
    SEQUENCE NAME public.main_userarticletag_id_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- Data for Name: auth_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group (id, name) FROM stdin;
\.


--
-- Data for Name: auth_group_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_group_permissions (id, group_id, permission_id) FROM stdin;
\.


--
-- Data for Name: auth_permission; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_permission (id, name, content_type_id, codename) FROM stdin;
1	Can add log entry	1	add_logentry
2	Can change log entry	1	change_logentry
3	Can delete log entry	1	delete_logentry
4	Can view log entry	1	view_logentry
5	Can add permission	2	add_permission
6	Can change permission	2	change_permission
7	Can delete permission	2	delete_permission
8	Can view permission	2	view_permission
9	Can add group	3	add_group
10	Can change group	3	change_group
11	Can delete group	3	delete_group
12	Can view group	3	view_group
13	Can add user	4	add_user
14	Can change user	4	change_user
15	Can delete user	4	delete_user
16	Can view user	4	view_user
17	Can add content type	5	add_contenttype
18	Can change content type	5	change_contenttype
19	Can delete content type	5	delete_contenttype
20	Can view content type	5	view_contenttype
21	Can add session	6	add_session
22	Can change session	6	change_session
23	Can delete session	6	delete_session
24	Can view session	6	view_session
25	Can add user	7	add_customuser
26	Can change user	7	change_customuser
27	Can delete user	7	delete_customuser
28	Can view user	7	view_customuser
29	Can add category	8	add_category
30	Can change category	8	change_category
31	Can delete category	8	delete_category
32	Can view category	8	view_category
33	Can add tag	9	add_tag
34	Can change tag	9	change_tag
35	Can delete tag	9	delete_tag
36	Can view tag	9	view_tag
37	Can add article	10	add_article
38	Can change article	10	change_article
39	Can delete article	10	delete_article
40	Can view article	10	view_article
41	Can add article like	11	add_articlelike
42	Can change article like	11	change_articlelike
43	Can delete article like	11	delete_articlelike
44	Can view article like	11	view_articlelike
45	Can add group	12	add_group
46	Can change group	12	change_group
47	Can delete group	12	delete_group
48	Can view group	12	view_group
49	Can add keyword	13	add_keyword
50	Can change keyword	13	change_keyword
51	Can delete keyword	13	delete_keyword
52	Can view keyword	13	view_keyword
53	Can add group article like	14	add_grouparticlelike
54	Can change group article like	14	change_grouparticlelike
55	Can delete group article like	14	delete_grouparticlelike
56	Can view group article like	14	view_grouparticlelike
57	Can add group invite	15	add_groupinvite
58	Can change group invite	15	change_groupinvite
59	Can delete group invite	15	delete_groupinvite
60	Can view group invite	15	view_groupinvite
61	Can add user article tag	16	add_userarticletag
62	Can change user article tag	16	change_userarticletag
63	Can delete user article tag	16	delete_userarticletag
64	Can view user article tag	16	view_userarticletag
65	Can add article metadata	17	add_articlemetadata
66	Can change article metadata	17	change_articlemetadata
67	Can delete article metadata	17	delete_articlemetadata
68	Can view article metadata	17	view_articlemetadata
69	Can add author	18	add_author
70	Can change author	18	change_author
71	Can delete author	18	delete_author
72	Can view author	18	view_author
\.


--
-- Data for Name: auth_user; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
1	pbkdf2_sha256$720000$CQ2FbJmhkWzAepNTTZ9G7Y$Nm6H/98q323C7T0IDjwLZsdbUjkVrEfrV5rURHHMnRo=	\N	f	user	Test	Login	user@gmail.com	f	t	2025-08-19 20:20:15.826874+00
\.


--
-- Data for Name: auth_user_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_groups (id, user_id, group_id) FROM stdin;
\.


--
-- Data for Name: auth_user_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.auth_user_user_permissions (id, user_id, permission_id) FROM stdin;
\.


--
-- Data for Name: django_admin_log; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_admin_log (id, action_time, object_id, object_repr, action_flag, change_message, content_type_id, user_id) FROM stdin;
\.


--
-- Data for Name: django_content_type; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_content_type (id, app_label, model) FROM stdin;
1	admin	logentry
2	auth	permission
3	auth	group
4	auth	user
5	contenttypes	contenttype
6	sessions	session
7	main	customuser
8	main	category
9	main	tag
10	main	article
11	main	articlelike
12	main	group
13	main	keyword
14	main	grouparticlelike
15	main	groupinvite
16	main	userarticletag
17	main	articlemetadata
18	main	author
\.


--
-- Data for Name: django_migrations; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_migrations (id, app, name, applied) FROM stdin;
1	contenttypes	0001_initial	2025-08-19 19:57:48.936332+00
2	auth	0001_initial	2025-08-19 19:57:49.042682+00
3	admin	0001_initial	2025-08-19 19:57:49.072334+00
4	admin	0002_logentry_remove_auto_add	2025-08-19 19:57:49.080278+00
5	admin	0003_logentry_add_action_flag_choices	2025-08-19 19:57:49.088759+00
6	contenttypes	0002_remove_content_type_name	2025-08-19 19:57:49.106849+00
7	auth	0002_alter_permission_name_max_length	2025-08-19 19:57:49.119588+00
8	auth	0003_alter_user_email_max_length	2025-08-19 19:57:49.129734+00
9	auth	0004_alter_user_username_opts	2025-08-19 19:57:49.138302+00
10	auth	0005_alter_user_last_login_null	2025-08-19 19:57:49.148565+00
11	auth	0006_require_contenttypes_0002	2025-08-19 19:57:49.150772+00
12	auth	0007_alter_validators_add_error_messages	2025-08-19 19:57:49.161615+00
13	auth	0008_alter_user_username_max_length	2025-08-19 19:57:49.17958+00
14	auth	0009_alter_user_last_name_max_length	2025-08-19 19:57:49.188901+00
15	auth	0010_alter_group_name_max_length	2025-08-19 19:57:49.199133+00
16	auth	0011_update_proxy_permissions	2025-08-19 19:57:49.2067+00
17	auth	0012_alter_user_first_name_max_length	2025-08-19 19:57:49.21788+00
18	main	0001_initial	2025-08-19 19:57:49.281111+00
19	main	0002_alter_customuser_groups_and_more	2025-08-19 19:57:49.302673+00
20	main	0003_category_tag_article_articlelike_group_keyword	2025-08-19 19:57:49.473148+00
21	main	0004_rename_author_article_added_by_and_more	2025-08-19 19:57:49.557047+00
22	main	0005_remove_article_tags_article_tag	2025-08-19 19:57:49.592447+00
23	main	0006_group_admin	2025-08-19 19:57:49.619304+00
24	main	0007_grouparticlelike	2025-08-19 19:57:49.656723+00
25	main	0008_groupinvite	2025-08-19 19:57:49.707146+00
26	main	0009_userarticletag	2025-08-19 19:57:49.754141+00
27	main	0010_remove_article_tag	2025-08-19 19:57:49.824276+00
28	main	0011_articlemetadata	2025-08-19 19:57:49.858461+00
29	main	0012_author_remove_article_author_name_article_authors	2025-08-19 19:57:49.930077+00
30	main	0013_alter_articlemetadata_creationdate	2025-08-19 19:57:49.95357+00
31	main	0014_remove_articlemetadata_author_and_more	2025-08-19 19:57:50.01132+00
32	sessions	0001_initial	2025-08-19 19:57:50.031581+00
\.


--
-- Data for Name: django_session; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.django_session (session_key, session_data, expire_date) FROM stdin;
\.


--
-- Data for Name: main_article; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_article (id, title, content, pdf_file, created_at, added_by_id) FROM stdin;
\.


--
-- Data for Name: main_article_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_article_authors (id, article_id, author_id) FROM stdin;
\.


--
-- Data for Name: main_article_categories; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_article_categories (id, article_id, category_id) FROM stdin;
\.


--
-- Data for Name: main_article_keywords; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_article_keywords (id, article_id, keyword_id) FROM stdin;
\.


--
-- Data for Name: main_articlelike; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_articlelike (id, created_at, article_id, user_id) FROM stdin;
\.


--
-- Data for Name: main_articlemetadata; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_articlemetadata (id, title, subject, "creationDate", keywords, creator, doi, article_id) FROM stdin;
\.


--
-- Data for Name: main_articlemetadata_authors; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_articlemetadata_authors (id, articlemetadata_id, author_id) FROM stdin;
\.


--
-- Data for Name: main_author; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_author (id, name) FROM stdin;
\.


--
-- Data for Name: main_category; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_category (id, name, description) FROM stdin;
\.


--
-- Data for Name: main_customuser; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_customuser (id, password, last_login, is_superuser, username, first_name, last_name, email, is_staff, is_active, date_joined) FROM stdin;
\.


--
-- Data for Name: main_customuser_groups; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_customuser_groups (id, customuser_id, group_id) FROM stdin;
\.


--
-- Data for Name: main_customuser_user_permissions; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_customuser_user_permissions (id, customuser_id, permission_id) FROM stdin;
\.


--
-- Data for Name: main_group; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_group (id, name, admin_id) FROM stdin;
\.


--
-- Data for Name: main_group_members; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_group_members (id, group_id, user_id) FROM stdin;
\.


--
-- Data for Name: main_grouparticlelike; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_grouparticlelike (id, created_at, article_id, group_id) FROM stdin;
\.


--
-- Data for Name: main_groupinvite; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_groupinvite (id, accepted, group_id, invited_user_id, sender_id) FROM stdin;
\.


--
-- Data for Name: main_keyword; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_keyword (id, keyword) FROM stdin;
\.


--
-- Data for Name: main_tag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_tag (id, name) FROM stdin;
\.


--
-- Data for Name: main_userarticletag; Type: TABLE DATA; Schema: public; Owner: postgres
--

COPY public.main_userarticletag (id, is_public, article_id, tag_id, user_id) FROM stdin;
\.


--
-- Name: auth_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_id_seq', 1, false);


--
-- Name: auth_group_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_group_permissions_id_seq', 1, false);


--
-- Name: auth_permission_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_permission_id_seq', 72, true);


--
-- Name: auth_user_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_groups_id_seq', 1, false);


--
-- Name: auth_user_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_id_seq', 1, true);


--
-- Name: auth_user_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.auth_user_user_permissions_id_seq', 1, false);


--
-- Name: django_admin_log_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_admin_log_id_seq', 1, false);


--
-- Name: django_content_type_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_content_type_id_seq', 18, true);


--
-- Name: django_migrations_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.django_migrations_id_seq', 32, true);


--
-- Name: main_article_authors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_article_authors_id_seq', 1, false);


--
-- Name: main_article_categories_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_article_categories_id_seq', 1, false);


--
-- Name: main_article_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_article_id_seq', 1, false);


--
-- Name: main_article_keywords_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_article_keywords_id_seq', 1, false);


--
-- Name: main_articlelike_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_articlelike_id_seq', 1, false);


--
-- Name: main_articlemetadata_authors_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_articlemetadata_authors_id_seq', 1, false);


--
-- Name: main_articlemetadata_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_articlemetadata_id_seq', 1, false);


--
-- Name: main_author_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_author_id_seq', 1, false);


--
-- Name: main_category_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_category_id_seq', 1, false);


--
-- Name: main_customuser_groups_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_customuser_groups_id_seq', 1, false);


--
-- Name: main_customuser_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_customuser_id_seq', 1, false);


--
-- Name: main_customuser_user_permissions_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_customuser_user_permissions_id_seq', 1, false);


--
-- Name: main_group_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_group_id_seq', 1, false);


--
-- Name: main_group_members_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_group_members_id_seq', 1, false);


--
-- Name: main_grouparticlelike_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_grouparticlelike_id_seq', 1, false);


--
-- Name: main_groupinvite_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_groupinvite_id_seq', 1, false);


--
-- Name: main_keyword_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_keyword_id_seq', 1, false);


--
-- Name: main_tag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_tag_id_seq', 1, false);


--
-- Name: main_userarticletag_id_seq; Type: SEQUENCE SET; Schema: public; Owner: postgres
--

SELECT pg_catalog.setval('public.main_userarticletag_id_seq', 1, false);


--
-- Name: auth_group auth_group_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_name_key UNIQUE (name);


--
-- Name: auth_group_permissions auth_group_permissions_group_id_permission_id_0cd325b0_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_permission_id_0cd325b0_uniq UNIQUE (group_id, permission_id);


--
-- Name: auth_group_permissions auth_group_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_group auth_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group
    ADD CONSTRAINT auth_group_pkey PRIMARY KEY (id);


--
-- Name: auth_permission auth_permission_content_type_id_codename_01ab375a_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_codename_01ab375a_uniq UNIQUE (content_type_id, codename);


--
-- Name: auth_permission auth_permission_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_pkey PRIMARY KEY (id);


--
-- Name: auth_user_groups auth_user_groups_user_id_group_id_94350c0c_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_group_id_94350c0c_uniq UNIQUE (user_id, group_id);


--
-- Name: auth_user auth_user_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_permission_id_14a6b632_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_permission_id_14a6b632_uniq UNIQUE (user_id, permission_id);


--
-- Name: auth_user auth_user_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user
    ADD CONSTRAINT auth_user_username_key UNIQUE (username);


--
-- Name: django_admin_log django_admin_log_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_pkey PRIMARY KEY (id);


--
-- Name: django_content_type django_content_type_app_label_model_76bd3d3b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_app_label_model_76bd3d3b_uniq UNIQUE (app_label, model);


--
-- Name: django_content_type django_content_type_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_content_type
    ADD CONSTRAINT django_content_type_pkey PRIMARY KEY (id);


--
-- Name: django_migrations django_migrations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_migrations
    ADD CONSTRAINT django_migrations_pkey PRIMARY KEY (id);


--
-- Name: django_session django_session_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_session
    ADD CONSTRAINT django_session_pkey PRIMARY KEY (session_key);


--
-- Name: main_article_authors main_article_authors_article_id_author_id_becf4af8_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_authors
    ADD CONSTRAINT main_article_authors_article_id_author_id_becf4af8_uniq UNIQUE (article_id, author_id);


--
-- Name: main_article_authors main_article_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_authors
    ADD CONSTRAINT main_article_authors_pkey PRIMARY KEY (id);


--
-- Name: main_article_categories main_article_categories_article_id_category_id_a4fb87c4_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_categories
    ADD CONSTRAINT main_article_categories_article_id_category_id_a4fb87c4_uniq UNIQUE (article_id, category_id);


--
-- Name: main_article_categories main_article_categories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_categories
    ADD CONSTRAINT main_article_categories_pkey PRIMARY KEY (id);


--
-- Name: main_article_keywords main_article_keywords_article_id_keyword_id_6ee1919b_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_keywords
    ADD CONSTRAINT main_article_keywords_article_id_keyword_id_6ee1919b_uniq UNIQUE (article_id, keyword_id);


--
-- Name: main_article_keywords main_article_keywords_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_keywords
    ADD CONSTRAINT main_article_keywords_pkey PRIMARY KEY (id);


--
-- Name: main_article main_article_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article
    ADD CONSTRAINT main_article_pkey PRIMARY KEY (id);


--
-- Name: main_articlelike main_articlelike_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlelike
    ADD CONSTRAINT main_articlelike_pkey PRIMARY KEY (id);


--
-- Name: main_articlemetadata main_articlemetadata_article_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata
    ADD CONSTRAINT main_articlemetadata_article_id_key UNIQUE (article_id);


--
-- Name: main_articlemetadata_authors main_articlemetadata_aut_articlemetadata_id_autho_8ee75ece_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata_authors
    ADD CONSTRAINT main_articlemetadata_aut_articlemetadata_id_autho_8ee75ece_uniq UNIQUE (articlemetadata_id, author_id);


--
-- Name: main_articlemetadata_authors main_articlemetadata_authors_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata_authors
    ADD CONSTRAINT main_articlemetadata_authors_pkey PRIMARY KEY (id);


--
-- Name: main_articlemetadata main_articlemetadata_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata
    ADD CONSTRAINT main_articlemetadata_pkey PRIMARY KEY (id);


--
-- Name: main_author main_author_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_author
    ADD CONSTRAINT main_author_pkey PRIMARY KEY (id);


--
-- Name: main_category main_category_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_category
    ADD CONSTRAINT main_category_pkey PRIMARY KEY (id);


--
-- Name: main_customuser_groups main_customuser_groups_customuser_id_group_id_8a5023dd_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_groups
    ADD CONSTRAINT main_customuser_groups_customuser_id_group_id_8a5023dd_uniq UNIQUE (customuser_id, group_id);


--
-- Name: main_customuser_groups main_customuser_groups_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_groups
    ADD CONSTRAINT main_customuser_groups_pkey PRIMARY KEY (id);


--
-- Name: main_customuser main_customuser_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser
    ADD CONSTRAINT main_customuser_pkey PRIMARY KEY (id);


--
-- Name: main_customuser_user_permissions main_customuser_user_per_customuser_id_permission_06a652d8_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_user_permissions
    ADD CONSTRAINT main_customuser_user_per_customuser_id_permission_06a652d8_uniq UNIQUE (customuser_id, permission_id);


--
-- Name: main_customuser_user_permissions main_customuser_user_permissions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_user_permissions
    ADD CONSTRAINT main_customuser_user_permissions_pkey PRIMARY KEY (id);


--
-- Name: main_customuser main_customuser_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser
    ADD CONSTRAINT main_customuser_username_key UNIQUE (username);


--
-- Name: main_group_members main_group_members_group_id_user_id_2940dd47_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group_members
    ADD CONSTRAINT main_group_members_group_id_user_id_2940dd47_uniq UNIQUE (group_id, user_id);


--
-- Name: main_group_members main_group_members_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group_members
    ADD CONSTRAINT main_group_members_pkey PRIMARY KEY (id);


--
-- Name: main_group main_group_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group
    ADD CONSTRAINT main_group_pkey PRIMARY KEY (id);


--
-- Name: main_grouparticlelike main_grouparticlelike_article_id_group_id_169ae7c5_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_grouparticlelike
    ADD CONSTRAINT main_grouparticlelike_article_id_group_id_169ae7c5_uniq UNIQUE (article_id, group_id);


--
-- Name: main_grouparticlelike main_grouparticlelike_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_grouparticlelike
    ADD CONSTRAINT main_grouparticlelike_pkey PRIMARY KEY (id);


--
-- Name: main_groupinvite main_groupinvite_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_groupinvite
    ADD CONSTRAINT main_groupinvite_pkey PRIMARY KEY (id);


--
-- Name: main_keyword main_keyword_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_keyword
    ADD CONSTRAINT main_keyword_pkey PRIMARY KEY (id);


--
-- Name: main_tag main_tag_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_tag
    ADD CONSTRAINT main_tag_name_key UNIQUE (name);


--
-- Name: main_tag main_tag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_tag
    ADD CONSTRAINT main_tag_pkey PRIMARY KEY (id);


--
-- Name: main_userarticletag main_userarticletag_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_userarticletag
    ADD CONSTRAINT main_userarticletag_pkey PRIMARY KEY (id);


--
-- Name: main_userarticletag main_userarticletag_user_id_article_id_tag_id_a36fb55f_uniq; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_userarticletag
    ADD CONSTRAINT main_userarticletag_user_id_article_id_tag_id_a36fb55f_uniq UNIQUE (user_id, article_id, tag_id);


--
-- Name: auth_group_name_a6ea08ec_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_name_a6ea08ec_like ON public.auth_group USING btree (name varchar_pattern_ops);


--
-- Name: auth_group_permissions_group_id_b120cbf9; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_group_id_b120cbf9 ON public.auth_group_permissions USING btree (group_id);


--
-- Name: auth_group_permissions_permission_id_84c5c92e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_group_permissions_permission_id_84c5c92e ON public.auth_group_permissions USING btree (permission_id);


--
-- Name: auth_permission_content_type_id_2f476e4b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_permission_content_type_id_2f476e4b ON public.auth_permission USING btree (content_type_id);


--
-- Name: auth_user_groups_group_id_97559544; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_group_id_97559544 ON public.auth_user_groups USING btree (group_id);


--
-- Name: auth_user_groups_user_id_6a12ed8b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_groups_user_id_6a12ed8b ON public.auth_user_groups USING btree (user_id);


--
-- Name: auth_user_user_permissions_permission_id_1fbb5f2c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_permission_id_1fbb5f2c ON public.auth_user_user_permissions USING btree (permission_id);


--
-- Name: auth_user_user_permissions_user_id_a95ead1b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_user_permissions_user_id_a95ead1b ON public.auth_user_user_permissions USING btree (user_id);


--
-- Name: auth_user_username_6821ab7c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX auth_user_username_6821ab7c_like ON public.auth_user USING btree (username varchar_pattern_ops);


--
-- Name: django_admin_log_content_type_id_c4bce8eb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_content_type_id_c4bce8eb ON public.django_admin_log USING btree (content_type_id);


--
-- Name: django_admin_log_user_id_c564eba6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_admin_log_user_id_c564eba6 ON public.django_admin_log USING btree (user_id);


--
-- Name: django_session_expire_date_a5c62663; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_expire_date_a5c62663 ON public.django_session USING btree (expire_date);


--
-- Name: django_session_session_key_c0390e0f_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX django_session_session_key_c0390e0f_like ON public.django_session USING btree (session_key varchar_pattern_ops);


--
-- Name: main_article_author_id_bbff2b24; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_author_id_bbff2b24 ON public.main_article USING btree (added_by_id);


--
-- Name: main_article_authors_article_id_cc41babb; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_authors_article_id_cc41babb ON public.main_article_authors USING btree (article_id);


--
-- Name: main_article_authors_author_id_14f320a6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_authors_author_id_14f320a6 ON public.main_article_authors USING btree (author_id);


--
-- Name: main_article_categories_article_id_9c3bfd39; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_categories_article_id_9c3bfd39 ON public.main_article_categories USING btree (article_id);


--
-- Name: main_article_categories_category_id_68d9643c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_categories_category_id_68d9643c ON public.main_article_categories USING btree (category_id);


--
-- Name: main_article_keywords_article_id_b350c01f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_keywords_article_id_b350c01f ON public.main_article_keywords USING btree (article_id);


--
-- Name: main_article_keywords_keyword_id_fd313528; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_article_keywords_keyword_id_fd313528 ON public.main_article_keywords USING btree (keyword_id);


--
-- Name: main_articlelike_article_id_35409c64; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_articlelike_article_id_35409c64 ON public.main_articlelike USING btree (article_id);


--
-- Name: main_articlelike_user_id_d9973801; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_articlelike_user_id_d9973801 ON public.main_articlelike USING btree (user_id);


--
-- Name: main_articlemetadata_authors_articlemetadata_id_abf15d00; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_articlemetadata_authors_articlemetadata_id_abf15d00 ON public.main_articlemetadata_authors USING btree (articlemetadata_id);


--
-- Name: main_articlemetadata_authors_author_id_edb75803; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_articlemetadata_authors_author_id_edb75803 ON public.main_articlemetadata_authors USING btree (author_id);


--
-- Name: main_customuser_groups_customuser_id_13869e25; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_customuser_groups_customuser_id_13869e25 ON public.main_customuser_groups USING btree (customuser_id);


--
-- Name: main_customuser_groups_group_id_8149f607; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_customuser_groups_group_id_8149f607 ON public.main_customuser_groups USING btree (group_id);


--
-- Name: main_customuser_user_permissions_customuser_id_34d37f86; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_customuser_user_permissions_customuser_id_34d37f86 ON public.main_customuser_user_permissions USING btree (customuser_id);


--
-- Name: main_customuser_user_permissions_permission_id_38e6f657; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_customuser_user_permissions_permission_id_38e6f657 ON public.main_customuser_user_permissions USING btree (permission_id);


--
-- Name: main_customuser_username_5ce75d5c_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_customuser_username_5ce75d5c_like ON public.main_customuser USING btree (username varchar_pattern_ops);


--
-- Name: main_group_admin_id_67f4b504; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_group_admin_id_67f4b504 ON public.main_group USING btree (admin_id);


--
-- Name: main_group_members_group_id_df2fa892; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_group_members_group_id_df2fa892 ON public.main_group_members USING btree (group_id);


--
-- Name: main_group_members_user_id_2ce4500c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_group_members_user_id_2ce4500c ON public.main_group_members USING btree (user_id);


--
-- Name: main_grouparticlelike_article_id_964eee7f; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_grouparticlelike_article_id_964eee7f ON public.main_grouparticlelike USING btree (article_id);


--
-- Name: main_grouparticlelike_group_id_21c3b291; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_grouparticlelike_group_id_21c3b291 ON public.main_grouparticlelike USING btree (group_id);


--
-- Name: main_groupinvite_group_id_d18a90a3; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_groupinvite_group_id_d18a90a3 ON public.main_groupinvite USING btree (group_id);


--
-- Name: main_groupinvite_invited_user_id_2d8cdc0b; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_groupinvite_invited_user_id_2d8cdc0b ON public.main_groupinvite USING btree (invited_user_id);


--
-- Name: main_groupinvite_sender_id_323660f6; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_groupinvite_sender_id_323660f6 ON public.main_groupinvite USING btree (sender_id);


--
-- Name: main_tag_name_b5f9d14d_like; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_tag_name_b5f9d14d_like ON public.main_tag USING btree (name varchar_pattern_ops);


--
-- Name: main_userarticletag_article_id_b4c51c4c; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_userarticletag_article_id_b4c51c4c ON public.main_userarticletag USING btree (article_id);


--
-- Name: main_userarticletag_tag_id_5dcc9844; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_userarticletag_tag_id_5dcc9844 ON public.main_userarticletag USING btree (tag_id);


--
-- Name: main_userarticletag_user_id_39319c2e; Type: INDEX; Schema: public; Owner: postgres
--

CREATE INDEX main_userarticletag_user_id_39319c2e ON public.main_userarticletag USING btree (user_id);


--
-- Name: auth_group_permissions auth_group_permissio_permission_id_84c5c92e_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissio_permission_id_84c5c92e_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_group_permissions auth_group_permissions_group_id_b120cbf9_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_group_permissions
    ADD CONSTRAINT auth_group_permissions_group_id_b120cbf9_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_permission auth_permission_content_type_id_2f476e4b_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_permission
    ADD CONSTRAINT auth_permission_content_type_id_2f476e4b_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_group_id_97559544_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_group_id_97559544_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_groups auth_user_groups_user_id_6a12ed8b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_groups
    ADD CONSTRAINT auth_user_groups_user_id_6a12ed8b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permi_permission_id_1fbb5f2c_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: auth_user_user_permissions auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.auth_user_user_permissions
    ADD CONSTRAINT auth_user_user_permissions_user_id_a95ead1b_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_content_type_id_c4bce8eb_fk_django_co; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_content_type_id_c4bce8eb_fk_django_co FOREIGN KEY (content_type_id) REFERENCES public.django_content_type(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: django_admin_log django_admin_log_user_id_c564eba6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.django_admin_log
    ADD CONSTRAINT django_admin_log_user_id_c564eba6_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article main_article_added_by_id_af464dfc_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article
    ADD CONSTRAINT main_article_added_by_id_af464dfc_fk_auth_user_id FOREIGN KEY (added_by_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_authors main_article_authors_article_id_cc41babb_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_authors
    ADD CONSTRAINT main_article_authors_article_id_cc41babb_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_authors main_article_authors_author_id_14f320a6_fk_main_author_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_authors
    ADD CONSTRAINT main_article_authors_author_id_14f320a6_fk_main_author_id FOREIGN KEY (author_id) REFERENCES public.main_author(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_categories main_article_categor_category_id_68d9643c_fk_main_cate; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_categories
    ADD CONSTRAINT main_article_categor_category_id_68d9643c_fk_main_cate FOREIGN KEY (category_id) REFERENCES public.main_category(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_categories main_article_categories_article_id_9c3bfd39_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_categories
    ADD CONSTRAINT main_article_categories_article_id_9c3bfd39_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_keywords main_article_keywords_article_id_b350c01f_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_keywords
    ADD CONSTRAINT main_article_keywords_article_id_b350c01f_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_article_keywords main_article_keywords_keyword_id_fd313528_fk_main_keyword_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_article_keywords
    ADD CONSTRAINT main_article_keywords_keyword_id_fd313528_fk_main_keyword_id FOREIGN KEY (keyword_id) REFERENCES public.main_keyword(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_articlelike main_articlelike_article_id_35409c64_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlelike
    ADD CONSTRAINT main_articlelike_article_id_35409c64_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_articlelike main_articlelike_user_id_d9973801_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlelike
    ADD CONSTRAINT main_articlelike_user_id_d9973801_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_articlemetadata main_articlemetadata_article_id_3572a296_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata
    ADD CONSTRAINT main_articlemetadata_article_id_3572a296_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_articlemetadata_authors main_articlemetadata_articlemetadata_id_abf15d00_fk_main_arti; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata_authors
    ADD CONSTRAINT main_articlemetadata_articlemetadata_id_abf15d00_fk_main_arti FOREIGN KEY (articlemetadata_id) REFERENCES public.main_articlemetadata(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_articlemetadata_authors main_articlemetadata_author_id_edb75803_fk_main_auth; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_articlemetadata_authors
    ADD CONSTRAINT main_articlemetadata_author_id_edb75803_fk_main_auth FOREIGN KEY (author_id) REFERENCES public.main_author(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_customuser_groups main_customuser_grou_customuser_id_13869e25_fk_main_cust; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_groups
    ADD CONSTRAINT main_customuser_grou_customuser_id_13869e25_fk_main_cust FOREIGN KEY (customuser_id) REFERENCES public.main_customuser(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_customuser_groups main_customuser_groups_group_id_8149f607_fk_auth_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_groups
    ADD CONSTRAINT main_customuser_groups_group_id_8149f607_fk_auth_group_id FOREIGN KEY (group_id) REFERENCES public.auth_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_customuser_user_permissions main_customuser_user_customuser_id_34d37f86_fk_main_cust; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_user_permissions
    ADD CONSTRAINT main_customuser_user_customuser_id_34d37f86_fk_main_cust FOREIGN KEY (customuser_id) REFERENCES public.main_customuser(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_customuser_user_permissions main_customuser_user_permission_id_38e6f657_fk_auth_perm; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_customuser_user_permissions
    ADD CONSTRAINT main_customuser_user_permission_id_38e6f657_fk_auth_perm FOREIGN KEY (permission_id) REFERENCES public.auth_permission(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_group main_group_admin_id_67f4b504_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group
    ADD CONSTRAINT main_group_admin_id_67f4b504_fk_auth_user_id FOREIGN KEY (admin_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_group_members main_group_members_group_id_df2fa892_fk_main_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group_members
    ADD CONSTRAINT main_group_members_group_id_df2fa892_fk_main_group_id FOREIGN KEY (group_id) REFERENCES public.main_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_group_members main_group_members_user_id_2ce4500c_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_group_members
    ADD CONSTRAINT main_group_members_user_id_2ce4500c_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_grouparticlelike main_grouparticlelike_article_id_964eee7f_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_grouparticlelike
    ADD CONSTRAINT main_grouparticlelike_article_id_964eee7f_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_grouparticlelike main_grouparticlelike_group_id_21c3b291_fk_main_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_grouparticlelike
    ADD CONSTRAINT main_grouparticlelike_group_id_21c3b291_fk_main_group_id FOREIGN KEY (group_id) REFERENCES public.main_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_groupinvite main_groupinvite_group_id_d18a90a3_fk_main_group_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_groupinvite
    ADD CONSTRAINT main_groupinvite_group_id_d18a90a3_fk_main_group_id FOREIGN KEY (group_id) REFERENCES public.main_group(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_groupinvite main_groupinvite_invited_user_id_2d8cdc0b_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_groupinvite
    ADD CONSTRAINT main_groupinvite_invited_user_id_2d8cdc0b_fk_auth_user_id FOREIGN KEY (invited_user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_groupinvite main_groupinvite_sender_id_323660f6_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_groupinvite
    ADD CONSTRAINT main_groupinvite_sender_id_323660f6_fk_auth_user_id FOREIGN KEY (sender_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_userarticletag main_userarticletag_article_id_b4c51c4c_fk_main_article_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_userarticletag
    ADD CONSTRAINT main_userarticletag_article_id_b4c51c4c_fk_main_article_id FOREIGN KEY (article_id) REFERENCES public.main_article(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_userarticletag main_userarticletag_tag_id_5dcc9844_fk_main_tag_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_userarticletag
    ADD CONSTRAINT main_userarticletag_tag_id_5dcc9844_fk_main_tag_id FOREIGN KEY (tag_id) REFERENCES public.main_tag(id) DEFERRABLE INITIALLY DEFERRED;


--
-- Name: main_userarticletag main_userarticletag_user_id_39319c2e_fk_auth_user_id; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.main_userarticletag
    ADD CONSTRAINT main_userarticletag_user_id_39319c2e_fk_auth_user_id FOREIGN KEY (user_id) REFERENCES public.auth_user(id) DEFERRABLE INITIALLY DEFERRED;


--
-- PostgreSQL database dump complete
--

\unrestrict nNeHLxVk7oPaADEvVksSQ50mc7fsGPR06ICG0GwlrlhBR2k5Hdu5C5CBw9qv2JD

--
-- PostgreSQL database cluster dump complete
--

