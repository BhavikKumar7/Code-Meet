
import { useEffect, useRef } from "react";
import Editor from "@monaco-editor/react";
import * as Y from "yjs";
import { MonacoBinding } from "y-monaco";
import { WebsocketProvider } from "y-websocket";

const getCurrentUser = (token) => {
  try {
    if (!token) return null;

    const payload = token.split(".")[1];
    if (!payload) return null;

    const base64 = payload
      .replace(/-/g, "+")
      .replace(/_/g, "/");

    const decoded = JSON.parse(
      decodeURIComponent(
        Array.from(atob(base64))
          .map((char) =>
            `%${char.charCodeAt(0).toString(16).padStart(2, "0")}`
          )
          .join("")
      )
    );

    const id = decoded.userId ?? decoded.id ?? decoded.sub;

    if (id == null) return null;

    return {
      id: String(id),
      name:
        decoded.username ??
        decoded.name ??
        decoded.fullName ??
        decoded.email ??
        `User ${id}`,
    };
  } catch (error) {
    console.error("Unable to identify current user:", error);
    return null;
  }
};

const CodeEditor = ({
  projectId,
  fileId,
  token,
  value,
  language = "plaintext",
  onChange,
  onPresenceChange,
}) => {
  const editorRef = useRef(null);
  const bindingRef = useRef(null);
  const codeDocRef = useRef(null);
  const codeProviderRef = useRef(null);
  const presenceDocRef = useRef(null);
  const presenceProviderRef = useRef(null);

  const handleEditorMount = (editor) => {
    editorRef.current = editor;

    const codeDoc = new Y.Doc();
    codeDocRef.current = codeDoc;

    // Keep code synchronization isolated per file.
    const codeProvider = new WebsocketProvider(
      "ws://localhost:1234",
      `project-${projectId}-file-${fileId}`,
      codeDoc
    );
    codeProviderRef.current = codeProvider;

    // Track presence across the whole project, not just this file.
    const presenceDoc = new Y.Doc();
    presenceDocRef.current = presenceDoc;

    const presenceProvider = new WebsocketProvider(
      "ws://localhost:1234",
      `project-${projectId}-presence`,
      presenceDoc
    );
    presenceProviderRef.current = presenceProvider;

    const currentUser = getCurrentUser(token);

    if (currentUser) {
      presenceProvider.awareness.setLocalStateField("user", currentUser);
    } else {
      console.error(
        "Presence unavailable: no user ID was found in the login token."
      );
    }

    const publishPresence = () => {
      const isConnected = presenceProvider.wsconnected;

      const users = Array.from(
        presenceProvider.awareness.getStates().entries()
      )
        .filter(([clientId, state]) => {
          const hasIdentity = state.user?.id != null;
          const isLocalClient =
            clientId === presenceProvider.awareness.clientID;

          return hasIdentity && (!isLocalClient || isConnected);
        })
        .map(([, state]) => ({
          id: String(state.user.id),
          name: state.user.name || `User ${state.user.id}`,
        }));

      // Multiple tabs for one user count as one person.
      const uniqueUsers = [
        ...new Map(users.map((user) => [user.id, user])).values(),
      ];

      onPresenceChange?.(uniqueUsers);
    };

    presenceProvider.awareness.on("change", publishPresence);
    presenceProvider.on("status", publishPresence);
    presenceProvider.on("sync", publishPresence);

    // Publish an initial list, including the local user when connected.
    publishPresence();

    const ytext = codeDoc.getText("monaco");

    codeProvider.on("synced", (isSynced) => {
      if (isSynced && ytext.length === 0 && value) {
        ytext.insert(0, value);
      }
    });

    ytext.observe(() => {
      onChange?.(ytext.toString());
    });

    const binding = new MonacoBinding(
      ytext,
      editor.getModel(),
      new Set([editor])
    );

    bindingRef.current = binding;

    console.log("Yjs editor and project presence initialized");
  };

  useEffect(() => {
    return () => {
      bindingRef.current?.destroy();

      codeProviderRef.current?.destroy();
      presenceProviderRef.current?.destroy();

      codeDocRef.current?.destroy();
      presenceDocRef.current?.destroy();

      bindingRef.current = null;
      codeProviderRef.current = null;
      presenceProviderRef.current = null;
      codeDocRef.current = null;
      presenceDocRef.current = null;

      onPresenceChange?.([]);
    };
  }, [projectId, fileId]);

  return (
    <Editor
      height="100%"
      theme="vs-dark"
      language={language}
      defaultValue={value}
      onMount={handleEditorMount}
      options={{
        minimap: { enabled: false },
        fontSize: 14,
      }}
    />
  );
};

export default CodeEditor;
