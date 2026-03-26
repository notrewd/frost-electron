import { useForm } from "@tanstack/react-form";
import {
  projectNameSchema,
  projectPathSchema,
} from "@/schemas/project-schemas.ts";
import { z } from "zod";
import {
  Field,
  FieldDescription,
  FieldError,
  FieldGroup,
  FieldLabel,
} from "@/components/ui/field.tsx";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button.tsx";
import PathInput from "@/components/ui/inputs/path-input.tsx";
import { invoke } from "@tauri-apps/api/core";
import { convertProjectNameToFileName } from "@/lib/utils";

const formSchema = z.object({
  projectName: projectNameSchema,
  projectPath: projectPathSchema,
});

const NewProjectRoute = () => {
  const form = useForm({
    defaultValues: {
      projectName: "",
      projectPath: "",
    },
    validators: {
      onSubmit: formSchema,
    },
    onSubmit: async (values) => {
      const { projectName, projectPath } = values.value;

      const fileName = convertProjectNameToFileName(projectName);

      await Promise.all([
        invoke("open_editor_window", {
          projectName: projectName,
          projectPath: `${projectPath}/${fileName}`,
        }),
      ]);

      await Promise.all([
        invoke("close_window", { label: "welcome" }),
        invoke("close_window", { label: "new-project" }),
      ]);
    },
  });

  return (
    <div className="flex flex-col flex-1">
      <form
        id="new-project-form"
        className="flex flex-col flex-1"
        onSubmit={(e) => {
          e.preventDefault();
          form.handleSubmit();
        }}
      >
        <FieldGroup className="gap-6">
          <form.Field
            name="projectName"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid} className="gap-1">
                  <FieldLabel htmlFor="projectName">Project Name</FieldLabel>
                  <Input
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="My Awesome Project"
                    variant="small"
                  />
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
          <form.Field
            name="projectPath"
            children={(field) => {
              const isInvalid =
                field.state.meta.isTouched && !field.state.meta.isValid;

              return (
                <Field data-invalid={isInvalid} className="gap-1">
                  <FieldLabel htmlFor="projectPath">Project Path</FieldLabel>
                  <PathInput
                    id={field.name}
                    name={field.name}
                    value={field.state.value}
                    onBlur={field.handleBlur}
                    onChange={(e) => field.handleChange(e.target.value)}
                    aria-invalid={isInvalid}
                    placeholder="/path/to/project"
                    variant="small"
                  />
                  <FieldDescription>
                    A new project file will be created at this location.
                  </FieldDescription>
                  {isInvalid && <FieldError errors={field.state.meta.errors} />}
                </Field>
              );
            }}
          />
        </FieldGroup>
      </form>
      <div className="flex justify-end mt-4">
        <Button type="submit" form="new-project-form">
          Create Project
        </Button>
      </div>
    </div>
  );
};

export default NewProjectRoute;
