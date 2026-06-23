import { useState } from "react";
import { useListRituals, getListRitualsQueryKey, useCreateRitual, useDeleteRitual, useUpdateRitual, useListRitualCompletions, getListRitualCompletionsQueryKey, useCreateRitualCompletion, useDeleteRitualCompletion } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Plus, Trash2, Edit2, Check, X } from "lucide-react";
import { asArray, apiErrorMessage, cn } from "@/lib/utils";
import { useToast } from "@/hooks/use-toast";

const TODAY = new Date().toISOString().slice(0, 10);

export default function Rituals() {
  const { data: ritualsData, isLoading } = useListRituals();
  const { data: completionsData } = useListRitualCompletions({ date: TODAY }, { query: { queryKey: getListRitualCompletionsQueryKey({ date: TODAY }) } });
  const rituals = asArray(ritualsData);
  const completions = asArray(completionsData);
  const createRitual = useCreateRitual();
  const deleteRitual = useDeleteRitual();
  const updateRitual = useUpdateRitual();
  const createCompletion = useCreateRitualCompletion();
  const deleteCompletion = useDeleteRitualCompletion();
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editLabel, setEditLabel] = useState("");

  function invalidateRituals() { queryClient.invalidateQueries({ queryKey: getListRitualsQueryKey() }); }
  function invalidateCompletions() { queryClient.invalidateQueries({ queryKey: getListRitualCompletionsQueryKey({ date: TODAY }) }); }

  function handleAdd() {
    if (!newLabel.trim()) return;
    createRitual.mutate({ data: { label: newLabel.trim() } }, {
      onSuccess: () => { invalidateRituals(); setNewLabel(""); toast({ title: "Ritual added" }); },
      onError: (err) => toast({
        title: "Failed to add ritual",
        description: apiErrorMessage(err, "Sign in and try again."),
        variant: "destructive",
      }),
    });
  }

  function handleDelete(id: number) {
    deleteRitual.mutate({ id }, {
      onSuccess: () => { invalidateRituals(); invalidateCompletions(); toast({ title: "Ritual removed" }); },
    });
  }

  function startEdit(id: number, label: string) { setEditingId(id); setEditLabel(label); }

  function saveEdit(id: number) {
    updateRitual.mutate({ id, data: { label: editLabel } }, {
      onSuccess: () => { invalidateRituals(); setEditingId(null); },
    });
  }

  function toggleCompletion(ritualId: number) {
    const existing = completions?.find((c) => c.ritualId === ritualId);
    if (existing) {
      deleteCompletion.mutate({ id: existing.id }, { onSuccess: invalidateCompletions });
    } else {
      createCompletion.mutate({ data: { ritualId, completedDate: TODAY } }, { onSuccess: invalidateCompletions });
    }
  }

  const completedCount = completions?.length ?? 0;
  const totalRituals = rituals?.length ?? 0;

  return (
    <div className="page-main max-w-xl space-y-6">
      <div>
        <h1 className="page-title">Daily Rituals</h1>
        <p className="page-subtitle">Pre and post-market habits that build discipline over time</p>
      </div>

      {/* Today's progress */}
      {totalRituals > 0 && (
        <div className="panel-padded">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-medium">Today's Progress</p>
            <span className="text-xs font-mono text-muted-foreground">{completedCount}/{totalRituals} complete</span>
          </div>
          <div className="h-2 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-chart-2 rounded-full transition-all duration-300"
              style={{ width: `${totalRituals > 0 ? (completedCount / totalRituals) * 100 : 0}%` }}
            />
          </div>
          {completedCount === totalRituals && totalRituals > 0 && (
            <p className="text-xs text-chart-2 mt-2 font-medium">All rituals complete — great discipline today.</p>
          )}
        </div>
      )}

      {/* Ritual checklist */}
      <div className="panel overflow-hidden">
        <div className="px-4 py-3 border-b border-border">
          <p className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Today — {new Date().toLocaleDateString("en-US", { month: "long", day: "numeric" })}</p>
        </div>

        {isLoading ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">Loading...</div>
        ) : !rituals || rituals.length === 0 ? (
          <div className="px-4 py-8 text-center text-sm text-muted-foreground">No rituals yet. Add your first habit below.</div>
        ) : (
          <div className="divide-y divide-border">
            {rituals.map((r) => {
              const done = completions?.some((c) => c.ritualId === r.id);
              return (
                <div key={r.id} className="group flex items-center gap-3 px-4 py-3 hover:bg-accent/20 transition-colors" data-testid={`ritual-item-${r.id}`}>
                  <button
                    onClick={() => toggleCompletion(r.id)}
                    data-testid={`button-toggle-${r.id}`}
                    className={cn(
                      "w-5 h-5 rounded border flex-shrink-0 flex items-center justify-center transition-all duration-150",
                      done ? "bg-chart-2 border-chart-2" : "border-border hover:border-chart-2"
                    )}
                  >
                    {done && <Check className="h-3 w-3 text-white stroke-[2.5]" />}
                  </button>

                  <div className="flex-1 min-w-0">
                    {editingId === r.id ? (
                      <input
                        value={editLabel}
                        onChange={(e) => setEditLabel(e.target.value)}
                        onKeyDown={(e) => { if (e.key === "Enter") saveEdit(r.id); if (e.key === "Escape") setEditingId(null); }}
                        autoFocus
                        data-testid={`input-edit-ritual-${r.id}`}
                        className="w-full px-2 py-0.5 text-sm bg-input border border-ring rounded focus:outline-none text-foreground"
                      />
                    ) : (
                      <p className={cn("text-sm", done && "line-through text-muted-foreground")}>{r.label}</p>
                    )}
                  </div>

                  <div className="flex items-center gap-1">
                    {editingId === r.id ? (
                      <>
                        <button onClick={() => saveEdit(r.id)} className="p-1 text-chart-2 hover:text-chart-2/80" data-testid={`button-save-ritual-${r.id}`}>
                          <Check className="h-3.5 w-3.5" />
                        </button>
                        <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground" data-testid={`button-cancel-ritual-${r.id}`}>
                          <X className="h-3.5 w-3.5" />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(r.id, r.label)} className="p-1 text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-all" data-testid={`button-edit-ritual-${r.id}`}>
                          <Edit2 className="h-3 w-3" />
                        </button>
                        <button onClick={() => handleDelete(r.id)} className="p-1 text-muted-foreground hover:text-destructive" data-testid={`button-delete-ritual-${r.id}`}>
                          <Trash2 className="h-3 w-3" />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Add ritual */}
        <div className="px-4 py-3 border-t border-border bg-muted/20">
          <div className="flex gap-2">
            <input
              value={newLabel}
              onChange={(e) => setNewLabel(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAdd()}
              placeholder="Add a ritual... (press Enter)"
              data-testid="input-new-ritual"
              className="flex-1 px-3 py-1.5 text-sm bg-input border border-border rounded-md focus:outline-none focus:ring-1 focus:ring-ring text-foreground placeholder:text-muted-foreground"
            />
            <button
              onClick={handleAdd}
              disabled={!newLabel.trim() || createRitual.isPending}
              data-testid="button-add-ritual"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-primary text-primary-foreground text-sm rounded-md hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              <Plus className="h-3.5 w-3.5" /> Add
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
