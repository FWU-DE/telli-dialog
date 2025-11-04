export type TemplateDetailViewProps = {
  templateType: string;
  templateId: string;
};

export default function TemplateDetailView(props: TemplateDetailViewProps) {
  return (
    <div>
      Template Detail View for {props.templateType} - {props.templateId}
    </div>
  );
}
