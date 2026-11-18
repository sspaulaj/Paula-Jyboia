ALTER TABLE "projects" DROP CONSTRAINT "projects_format_version_check";
ALTER TABLE "projects" ADD CONSTRAINT "projects_format_version_check" CHECK ("format_version" IN (1, 2));
