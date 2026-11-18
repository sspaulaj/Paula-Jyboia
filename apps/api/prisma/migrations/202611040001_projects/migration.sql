CREATE TABLE "projects" (
  "id" UUID NOT NULL,
  "name" VARCHAR(120) NOT NULL,
  "description" VARCHAR(2000) NOT NULL DEFAULT '',
  "workspace_data" JSONB NOT NULL,
  "format_version" INTEGER NOT NULL,
  "revision" INTEGER NOT NULL DEFAULT 1,
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "updated_at" TIMESTAMP(3) NOT NULL,
  CONSTRAINT "projects_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "projects_revision_check" CHECK ("revision" > 0),
  CONSTRAINT "projects_format_version_check" CHECK ("format_version" = 1),
  CONSTRAINT "projects_name_check" CHECK (char_length(btrim("name")) > 0),
  CONSTRAINT "projects_workspace_object_check" CHECK (jsonb_typeof("workspace_data") = 'object')
);
CREATE INDEX "projects_created_at_id_idx" ON "projects"("created_at", "id");
