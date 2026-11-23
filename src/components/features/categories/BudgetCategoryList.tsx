"use client";

/**
 * ==============================================================================
 * Kenzo Treasury — Budget Category List Grid (Fase F7, R1, R3, R4, R6)
 * ==============================================================================
 *
 * ── Kenapa komponen ini ada ───────────────────────────────────────────────────
 *
 * Menampilkan grid responsif pos pengeluaran anggaran bulanan, dilengkapi modal
 * tambah pos kustom (`addCustomCategory`) menggunakan `IconPicker` dan
 * `SlidingSegmentedControl`.
 */

import * as React from "react";
import { useRouter } from "next/navigation";
import { Plus, Loader2, FolderPlus } from "lucide-react";
import { toast } from "sonner";
import {
  BudgetCategoryCard,
  type BudgetCategoryItem,
} from "./BudgetCategoryCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { IconPicker } from "@/components/common/IconPicker";
import { SlidingSegmentedControl } from "@/components/common/SlidingSegmentedControl";
import { formatRupiah, parseRupiah } from "@/lib/financial-calculations";
import { addCustomCategory } from "@/actions/categories";
import { cn } from "@/lib/utils";

export type { BudgetCategoryItem } from "./BudgetCategoryCard";

interface BudgetCategoryListProps {
  /**
   * Daftar pos anggaran yang akan ditampilkan.
   */
  categories: BudgetCategoryItem[];
  /**
   * Pemasukan gaji pokok yang menjadi dasar alokasi.
   */
  salaryBase: number;
  /**
   * Total target akumulasi seluruh pos anggaran.
   */
  totalTarget: number;
  /**
   * ID bulan aktif untuk penambahan pos kustom.
   */
  monthId?: string;
  /**
   * Apakah siklus bulan sudah ditutup.
   */
  isClosed?: boolean;
}

const GROUP_OPTIONS: Array<{
  value: "kebutuhan" | "pos_wajib";
  label: string;
}> = [
  { value: "kebutuhan", label: "Kebutuhan" },
  { value: "pos_wajib", label: "Pos Wajib" },
];

export function BudgetCategoryList({
  categories,
  salaryBase,
  totalTarget,
  monthId,
  isClosed = false,
}: BudgetCategoryListProps) {
  const router = useRouter();
  const [openAddDialog, setOpenAddDialog] = React.useState(false);
  const [name, setName] = React.useState("");
  const [icon, setIcon] = React.useState("package");
  const [group, setGroup] = React.useState<"pos_wajib" | "kebutuhan">(
    "kebutuhan"
  );
  const [targetRaw, setTargetRaw] = React.useState("150000");
  const [formError, setFormError] = React.useState<string | null>(null);
  const [isPending, startTransition] = React.useTransition();

  // Pos Uang Bebas / Tabungan selalu diletakkan di urutan paling akhir kartu
  const orderedCategories = React.useMemo(() => {
    const regular = categories.filter(
      (cat) => cat.group !== "uang_bebas_tabungan"
    );
    const free = categories.filter(
      (cat) => cat.group === "uang_bebas_tabungan"
    );
    return [...regular, ...free];
  }, [categories]);

  const reassignOptions = React.useMemo(
    () =>
      orderedCategories
        .filter((cat) => Boolean(cat.id))
        .map((cat) => ({
          id: cat.id!,
          name: cat.name,
          group: cat.group,
          liabilityId: cat.liabilityId,
        })),
    [orderedCategories]
  );

  const handleAddCategory = (e: React.FormEvent) => {
    e.preventDefault();
    if (!monthId) return;

    const trimmedName = name.trim();
    if (trimmedName.length < 2) {
      setFormError("Nama pos anggaran minimal 2 karakter");
      return;
    }

    const numericTarget = parseRupiah(targetRaw);
    if (numericTarget < 0) {
      setFormError("Target alokasi tidak boleh negatif");
      return;
    }

    setFormError(null);
    startTransition(async () => {
      const res = await addCustomCategory({
        monthId,
        name: trimmedName,
        icon: icon.trim() || "package",
        group,
        targetBudget: numericTarget,
        isTemporary: true,
        sortOrder: categories.length + 1,
      });

      if (!res.success) {
        setFormError(res.error);
        return;
      }

      toast.success(`Pos "${res.data.name}" ditambahkan`, {
        description: `Alokasi: ${formatRupiah(res.data.targetBudget)}`,
      });
      setName("");
      setIcon("package");
      setGroup("kebutuhan");
      setTargetRaw("150000");
      setOpenAddDialog(false);
      router.refresh();
    });
  };

  return (
    <div id="pos-anggaran" className="space-y-4 pt-2">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground tabular-nums">
            {categories.length} Pos Anggaran & Alokasi Bulan Ini
          </h2>
          <p className="text-xs text-muted-foreground tabular-nums">
            Alokasi pos terencana dari pemasukan {formatRupiah(salaryBase)} untuk
            mencegah kebocoran kas.
          </p>
        </div>

        <div className="flex items-center gap-2.5">
          <span className="text-xs font-medium text-muted-foreground hidden sm:inline tabular-nums">
            Total Target: {formatRupiah(totalTarget)}
          </span>

          {monthId && !isClosed && (
            <Dialog open={openAddDialog} onOpenChange={setOpenAddDialog}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="h-9 px-3 rounded-xl gap-1.5 text-xs font-medium"
                >
                  <FolderPlus className="size-3.5" />
                  <span>Tambah Pos</span>
                </Button>
              </DialogTrigger>

              <DialogContent className="sm:max-w-md max-h-[90dvh]">
                <DialogHeader className="px-6 pt-5 pb-3.5 border-b border-border/40 shrink-0 text-left pr-14">
                  <DialogTitle className="text-base font-bold text-foreground">
                    Tambah Pos Anggaran Kustom
                  </DialogTitle>
                  <DialogDescription className="text-xs text-muted-foreground leading-relaxed">
                    Buat pos pengeluaran tambahan khusus untuk siklus bulan ini.
                  </DialogDescription>
                </DialogHeader>

                <form
                  onSubmit={handleAddCategory}
                  className="flex flex-col flex-1 min-h-0 w-full m-0 p-0"
                >
                  <div className="flex-1 overflow-y-auto px-6 py-4 space-y-3.5">
                    <div className="space-y-1">
                      <Label htmlFor="cat-name" className="text-xs">
                        Nama Pos Anggaran
                      </Label>
                      <Input
                        id="cat-name"
                        placeholder="Contoh: Kursus & Buku"
                        value={name}
                        onChange={(e) => {
                          setName(e.target.value);
                          setFormError(null);
                        }}
                        className={cn(
                          "h-10 rounded-xl text-xs",
                          formError && "border-destructive"
                        )}
                      />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      <div className="space-y-1">
                        <Label htmlFor="cat-target" className="text-xs">
                          Target Alokasi (Rp)
                        </Label>
                        <Input
                          id="cat-target"
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
                        <Label className="text-xs">Kelompok Pos</Label>
                        <SlidingSegmentedControl
                          options={GROUP_OPTIONS}
                          value={group}
                          onValueChange={setGroup}
                          role="radiogroup"
                          ariaLabel="Pilih kelompok pos anggaran"
                          fullWidth
                          size="sm"
                          recalculateTrigger={openAddDialog}
                        />
                      </div>
                    </div>

                    <IconPicker
                      value={icon}
                      onChange={setIcon}
                      fallbackGroup={group}
                      label="Pilih Ikon Pos"
                    />

                    {formError && (
                      <p className="text-xs font-medium text-destructive">
                        {formError}
                      </p>
                    )}
                  </div>

                  <DialogFooter className="w-full border-t border-border/60 bg-background px-6 py-4 flex flex-row items-center justify-end gap-2.5 shrink-0 mt-auto">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => setOpenAddDialog(false)}
                      className="rounded-xl cursor-pointer"
                    >
                      Batal
                    </Button>
                    <Button
                      type="submit"
                      size="sm"
                      disabled={isPending}
                      className="rounded-xl gap-1.5 cursor-pointer font-semibold shadow-xs"
                    >
                      {isPending ? (
                        <Loader2 className="size-3.5 animate-spin" />
                      ) : (
                        <Plus className="size-3.5" />
                      )}
                      <span>Simpan Pos</span>
                    </Button>
                  </DialogFooter>
                </form>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
        {orderedCategories.map((cat) => (
          <BudgetCategoryCard
            key={cat.id ?? cat.name}
            category={cat}
            otherCategories={reassignOptions}
            isClosed={isClosed}
          />
        ))}
      </div>
    </div>
  );
}
