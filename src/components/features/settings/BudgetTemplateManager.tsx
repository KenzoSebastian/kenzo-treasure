"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Template Manager (Fase R3 & R4)
 * ==============================================================================
 *
 * Mengelola daftar template pos anggaran rutin pengguna (`user_budget_templates`)
 * di halaman `/dashboard/settings`:
 * - Tambah, ubah, aktif/nonaktifkan, dan hapus template pos anggaran rutin.
 * - Menggunakan `AppCategoryIcon`, `IconPicker`, dan `SlidingSegmentedControl`.
 * - Setiap perubahan pada template digunakan sebagai blueprint saat pengguna
 *   membuat siklus bulan baru (apabila belum ada bulan sebelumnya).
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import {
  Layers,
  Plus,
  Pencil,
  Trash2,
  Loader2,
  Check,
} from "lucide-react";
import { toast } from "sonner";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { AppCategoryIcon } from "@/components/common/AppCategoryIcon";
import { IconPicker } from "@/components/common/IconPicker";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import {
  upsertBudgetTemplate,
  deleteBudgetTemplate,
} from "@/actions/settings";
import { cn } from "@/lib/utils";
import type { UserBudgetTemplate, CategoryGroup } from "@/db/schema";

export type BudgetTemplateRow = UserBudgetTemplate & {
  isActive?: boolean;
};

export interface BudgetTemplateManagerProps {
  templates: BudgetTemplateRow[];
  defaultBaseSalary?: number | null;
}

const TEMPLATE_GROUP_OPTIONS: Array<{
  value: CategoryGroup;
  label: string;
}> = [
  { value: "pos_wajib", label: "Pos Wajib" },
  { value: "kebutuhan", label: "Kebutuhan" },
  { value: "uang_bebas_tabungan", label: "Uang Bebas" },
];

const GROUP_LABELS: Record<CategoryGroup, string> = {
  pos_wajib: "Pos Wajib",
  kebutuhan: "Kebutuhan",
  uang_bebas_tabungan: "Uang Bebas / Tabungan",
};

export function BudgetTemplateManager({
  templates,
  defaultBaseSalary,
}: BudgetTemplateManagerProps) {
  const router = useRouter();
  const [dialogOpen, setDialogOpen] = React.useState(false);
  const [editingId, setEditingId] = React.useState<string | undefined>(
    undefined
  );
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("wallet");
  const [group, setGroup] = React.useState<CategoryGroup>("kebutuhan");
  const [targetRaw, setTargetRaw] = React.useState("0");
  const [isActive, setIsActive] = React.useState(true);
  const [sortOrder, setSortOrder] = React.useState(1);
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  const totalActiveBudget = React.useMemo(
    () =>
      templates
        .filter((t) => t.isActive !== false && t.group !== "uang_bebas_tabungan")
        .reduce((acc, item) => acc + item.targetBudget, 0),
    [templates]
  );

  const openCreateModal = () => {
    setEditingId(undefined);
    setName("");
    setIcon("wallet");
    setGroup("kebutuhan");
    setTargetRaw("0");
    setIsActive(true);
    setSortOrder(templates.length + 1);
    setFormError(null);
    setDialogOpen(true);
  };

  const openEditModal = (tpl: BudgetTemplateRow) => {
    setEditingId(tpl.id);
    setName(tpl.name);
    setIcon(tpl.icon);
    setGroup(tpl.group);
    setTargetRaw(String(tpl.targetBudget));
    setIsActive(tpl.isActive !== false);
    setSortOrder(tpl.sortOrder);
    setFormError(null);
    setDialogOpen(true);
  };

  const handleSaveTemplate = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setFormError("Nama template pos anggaran minimal 2 karakter.");
      return;
    }

    const numericTarget = parseRupiah(targetRaw);
    if (numericTarget < 0) {
      setFormError("Target anggaran tidak boleh bernilai negatif.");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const res = await upsertBudgetTemplate({
        id: editingId,
        name: trimmedName,
        icon: icon.trim() || "wallet",
        group,
        targetBudget: numericTarget,
        sortOrder,
        isActive,
      });

      if (!res.success) {
        setFormError(res.error);
        return;
      }

      toast.success(
        editingId
          ? `Template "${res.data.name}" diperbarui`
          : `Template "${res.data.name}" ditambahkan`
      );
      setDialogOpen(false);
      router.refresh();
    });
  };

  const handleDelete = (tpl: BudgetTemplateRow) => {
    setDeletingId(tpl.id);
    startTransition(async () => {
      const res = await deleteBudgetTemplate({ templateId: tpl.id });
      setDeletingId(null);

      if (!res.success) {
        toast.error(res.error);
        return;
      }

      toast.success(`Template "${tpl.name}" dihapus dari daftar rutin`);
      router.refresh();
    });
  };

  return (
    <Card className="rounded-2xl border border-border/80 bg-card p-5 sm:p-6 space-y-5 shadow-xs">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-border/60 pb-4">
        <div className="flex items-center gap-3">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            <Layers className="size-5" />
          </div>
          <div>
            <h2 className="text-base font-bold tracking-tight text-foreground">
              Manajemen Template Pos Anggaran Rutin
            </h2>
            <p className="text-xs text-muted-foreground tabular-nums">
              {templates.length} pos terdaftar • Total komitmen rutin aktif:{" "}
              <strong className="text-foreground">
                {formatRupiah(totalActiveBudget)}
              </strong>
              {typeof defaultBaseSalary === "number" && defaultBaseSalary > 0
                ? ` dari gaji default ${formatRupiah(defaultBaseSalary)}`
                : ""}
            </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={openCreateModal}
          className="h-9 px-3.5 rounded-xl gap-1.5 text-xs font-semibold self-start sm:self-auto"
        >
          <Plus className="size-3.5" />
          <span>Tambah Pos Rutin</span>
        </Button>
      </div>

      {templates.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/15 p-6 text-center space-y-2">
          <p className="text-xs font-semibold text-foreground">
            Belum ada template pos anggaran rutin
          </p>
          <p className="text-[11px] text-muted-foreground max-w-md mx-auto">
            Tambahkan pos pengeluaran rutin Anda (seperti Tagihan Listrik,
            Transportasi, atau Kebutuhan Rumah) agar otomatis disiapkan setiap
            membuka siklus bulan baru.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {templates.map((tpl) => (
            <div
              key={tpl.id}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border p-3.5 transition-colors",
                tpl.isActive !== false
                  ? "border-border/80 bg-card"
                  : "border-border/40 bg-muted/20 opacity-65"
              )}
            >
              <div className="flex items-center gap-3 min-w-0">
                <AppCategoryIcon
                  iconKey={tpl.icon}
                  group={tpl.group}
                  size="md"
                />
                <div className="min-w-0 space-y-0.5">
                  <div className="flex items-center gap-1.5">
                    <span className="text-xs font-bold text-foreground truncate">
                      {tpl.name}
                    </span>
                    <Badge
                      variant="outline"
                      className="text-[10px] px-1.5 py-0 rounded-full shrink-0"
                    >
                      {GROUP_LABELS[tpl.group]}
                    </Badge>
                    {tpl.isActive === false && (
                      <Badge
                        variant="secondary"
                        className="text-[10px] px-1.5 py-0 rounded-full shrink-0"
                      >
                        Nonaktif
                      </Badge>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground tabular-nums">
                    Target default:{" "}
                    <strong className="text-foreground">
                      {formatRupiah(tpl.targetBudget)}
                    </strong>
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-1 shrink-0">
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  onClick={() => openEditModal(tpl)}
                  className="size-8 rounded-lg text-muted-foreground hover:text-foreground"
                  aria-label={`Ubah template ${tpl.name}`}
                >
                  <Pencil className="size-3.5" />
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  disabled={deletingId === tpl.id || isPending}
                  onClick={() => handleDelete(tpl)}
                  className="size-8 rounded-lg text-muted-foreground hover:text-destructive hover:bg-destructive/10"
                  aria-label={`Hapus template ${tpl.name}`}
                >
                  {deletingId === tpl.id ? (
                    <Loader2 className="size-3.5 animate-spin" />
                  ) : (
                    <Trash2 className="size-3.5" />
                  )}
                </Button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md rounded-2xl p-6 max-h-[90dvh] overflow-y-auto">
          <form onSubmit={handleSaveTemplate} className="space-y-4" noValidate>
            <DialogHeader>
              <DialogTitle className="text-base font-bold">
                {editingId
                  ? "Ubah Template Pos Anggaran"
                  : "Tambah Template Pos Anggaran"}
              </DialogTitle>
              <DialogDescription className="text-xs text-muted-foreground">
                Atur nama, kelompok, target alokasi default, dan ikon untuk pos
                anggaran rutin ini.
              </DialogDescription>
            </DialogHeader>

            <div className="space-y-3.5">
              <div className="space-y-1">
                <Label htmlFor="tpl-name" className="text-xs font-medium">
                  Nama Pos Anggaran
                </Label>
                <Input
                  id="tpl-name"
                  placeholder="Contoh: Tagihan Listrik & Internet"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value);
                    setFormError(null);
                  }}
                  className="h-10 rounded-xl text-xs"
                />
              </div>

              <div className="space-y-1">
                <Label htmlFor="tpl-target" className="text-xs font-medium">
                  Target Alokasi Default (Rp)
                </Label>
                <Input
                  id="tpl-target"
                  type="text"
                  inputMode="numeric"
                  value={
                    parseRupiah(targetRaw) > 0
                      ? parseRupiah(targetRaw).toLocaleString("id-ID")
                      : "0"
                  }
                  onChange={(e) =>
                    setTargetRaw(String(parseRupiah(e.target.value)))
                  }
                  className="h-10 rounded-xl text-xs tabular-nums"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs font-medium">Kelompok Pos</Label>
                <SlidingSegmentedControl
                  options={TEMPLATE_GROUP_OPTIONS}
                  value={group}
                  onValueChange={setGroup}
                  role="radiogroup"
                  ariaLabel="Kelompok template pos anggaran"
                  fullWidth
                  size="sm"
                  recalculateTrigger={dialogOpen}
                />
              </div>

              <IconPicker
                value={icon}
                onChange={setIcon}
                fallbackGroup={group}
                label="Pilih Ikon Pos"
              />

              <label className="flex items-center gap-2.5 rounded-xl border border-border/70 bg-muted/20 p-3 text-xs cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={isActive}
                  onChange={(e) => setIsActive(e.target.checked)}
                  className="size-4 rounded accent-primary"
                />
                <span className="font-medium text-foreground">
                  Aktifkan pos ini pada pembuatan siklus bulan baru
                </span>
              </label>

              {formError && (
                <p className="text-xs font-medium text-destructive">
                  {formError}
                </p>
              )}
            </div>

            <DialogFooter className="gap-2">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => setDialogOpen(false)}
                className="rounded-xl"
              >
                Batal
              </Button>
              <Button
                type="submit"
                size="sm"
                disabled={isPending}
                className="rounded-xl gap-1.5"
              >
                {isPending ? (
                  <Loader2 className="size-3.5 animate-spin" />
                ) : (
                  <Check className="size-3.5" />
                )}
                <span>Simpan Template</span>
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </Card>
  );
}
