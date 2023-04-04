## Zowe Explorer Save Handling

### Legacy

```mermaid
flowchart TD
    begin[VS Code begins save operation]
    begin-->format

    format(VS Code formatter extensions apply changes to the document)
    format-->willSave

    willSave{{"`onWillSaveTextDocument` event\n(1.5s threshold)"}}
    willSave-->|VS Code| isConflict
    willSave-->|Zowe Explorer| enqueueUpload

    isConflict(Is there a conflict with the current save operation and a new save operation?)
    isConflict-->|Yes| promptConflictResolution
    isConflict-->|No| saveToDisk

    promptConflictResolution{{Compare or overwrite changes?}}
    promptConflictResolution-->|Compare| vscodeDiff
    promptConflictResolution-->|Overwrite| begin

    vscodeDiff(Show diff between old and new versions of file)
    vscodeDiff-->userResolvesConflicts

    userResolvesConflicts(User chooses desired version of file to upload)
    userResolvesConflicts-->begin

    saveToDisk(VS code saves file to disk)
    saveToDisk-->markAsSaved

    markAsSaved(VS Code marks document as saved)

    enqueueUpload(Add document to upload queue)
    enqueueUpload-->filesInQueue

    filesInQueue{{Is a document currently being uploaded?}}
    filesInQueue -->|Yes| exit[End of event handler]
    filesInQueue -->|No| gotoQueue("Process upload queue\n(go to 2nd chart)")
    gotoQueue-->exit
```

### New

```mermaid
flowchart TD
    begin[VS Code begins save operation]
    begin-->format

    format(VS Code formatter extensions apply changes to the document)
    format-->isConflict

    didSave("`onDidSaveTextDocument` event\n(No time limit)")
    didSave-->enqueueUpload

    isConflict(VS Code: Is there a conflict with the current save operation and a new save operation?)
    isConflict-->|Yes| promptConflictResolution
    isConflict-->|No| saveToDisk

    promptConflictResolution{{Compare or overwrite changes?}}
    promptConflictResolution-->|Compare| vscodeDiff
    promptConflictResolution-->|Overwrite| begin

    vscodeDiff(Show diff between old and new versions of file)
    vscodeDiff-->userResolvesConflicts

    userResolvesConflicts(User chooses desired version of file to upload)
    userResolvesConflicts-->begin

    saveToDisk(VS code saves file to disk)
    saveToDisk-->markAsSaved
    saveToDisk-->didSave

    markAsSaved(VS Code marks document as saved)

    enqueueUpload(Zowe Explorer: Add document to upload queue)
    enqueueUpload-->filesInQueue

    filesInQueue{{Is a document currently being uploaded?}}
    filesInQueue -->|Yes| exit[End of event handler]
    filesInQueue -->|No| gotoQueue("Process upload queue\n(go to 2nd chart)")
    gotoQueue-->exit
```

## Zowe Explorer Upload Queue

### Legacy

```mermaid
flowchart TD
    iterateUploadQueue[Process next document in upload queue]
    iterateUploadQueue-->awaitMfRequest

    awaitMfRequest(Call Zowe API that uploads file from disk to MF)
    awaitMfRequest -->|Success| checkQueue
    awaitMfRequest -->|Conflict| downloadRemoteDs
    awaitMfRequest -->|Failure| markAsDirty

    downloadRemoteDs(Download contents from MF to compare)
    downloadRemoteDs-->updateEditorContents

    updateEditorContents(Update document with MF contents to trigger conflict)
    updateEditorContents-->checkQueue
    updateEditorContents-->gotoVsCodeSaveOp

    checkQueue{{Are there more documents in the upload queue?}}
    checkQueue -->|Yes| iterateUploadQueue

    gotoVsCodeSaveOp("Restart VS Code save operation\n(go to 1st chart)")

    markAsDirty(Mark document as dirty)
    markAsDirty-->throwError

    throwError(Display error in Zowe Explorer)
    throwError-->iterateUploadQueue
```

### New

```mermaid
flowchart TD
    iterateUploadQueue[Process next document in upload queue]
    iterateUploadQueue-->newerSavesInQueue

    newerSavesInQueue{{Are there more pending uploads for same document in queue?}}
    newerSavesInQueue-->|Yes| iterateUploadQueue
    newerSavesInQueue-->|No| awaitMfRequest

    awaitMfRequest(Call Zowe API that uploads file from disk to MF)
    awaitMfRequest -->|Success| checkQueue
    awaitMfRequest -->|Conflict| downloadRemoteDs
    awaitMfRequest -->|Failure| markAsDirty

    downloadRemoteDs(Download contents from MF to compare)
    downloadRemoteDs-->updateEditorContents

    updateEditorContents(Update document with MF contents to trigger conflict)
    updateEditorContents-->checkQueue
    updateEditorContents-->gotoVsCodeSaveOp

    checkQueue{{Are there more documents in the upload queue?}}
    checkQueue -->|Yes| iterateUploadQueue

    gotoVsCodeSaveOp("Restart VS Code save operation\n(go to 1st chart)")

    markAsDirty(Mark document as dirty)
    markAsDirty-->throwError

    throwError(Display error in Zowe Explorer)
    throwError-->iterateUploadQueue
```

---

**TODO:** [v3] Update flowcharts to use `vscode.FileSystemProvider`