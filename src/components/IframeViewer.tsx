import { useState } from "react";
import { Loader2 } from "lucide-react";

interface IframeViewerProps {
  url: string;
  name: string;
}

const IframeViewer = ({ url, name }: IframeViewerProps) => {
  const [loading, setLoading] = useState(true);

  return (
    <div className="h-full w-full relative bg-background">
      {loading && (
        <div className="absolute inset-0 flex items-center justify-center z-10 bg-background">
          <div className="flex flex-col items-center gap-4">
            <Loader2 className="w-8 h-8 text-primary animate-spin" />
            <p className="text-muted-foreground text-sm">Chargement de {name}...</p>
          </div>
        </div>
      )}
      <iframe
        src={url}
        className="w-full h-full border-none"
        onLoad={() => setLoading(false)}
        title={name}
        sandbox="allow-same-origin allow-scripts allow-popups allow-forms allow-modals"
      />
    </div>
  );
};

export default IframeViewer;
