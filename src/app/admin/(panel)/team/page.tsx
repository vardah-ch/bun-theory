import { db } from "@/lib/server/db";
import { requireStaff } from "@/lib/server/auth";
import { Badge, Card, Field, PageHeader } from "@/components/admin/ui";
import { ActionForm } from "@/components/admin/ActionForm";
import { addTeamMember, toggleTeamMember } from "../../actions/settings";
import { PasswordForm } from "./PasswordForm";

export default async function TeamPage() {
  const s = await requireStaff();
  const users = s.role === "OWNER" ? await db.user.findMany({ orderBy: { createdAt: "asc" } }) : [];
  return (
    <>
      <PageHeader title="Team & account" kicker={s.email} />
      <div className="grid gap-4 xl:grid-cols-2">
        <Card title="Change your password">
          <PasswordForm />
        </Card>
        {s.role === "OWNER" ? (
          <Card title="Staff accounts">
            <ul className="space-y-2 text-sm">
              {users.map((u) => (
                <li key={u.id} className="flex flex-wrap items-center gap-3 border-b border-cream/10 pb-2">
                  <span className="min-w-40">{u.name}<span className="block text-xs text-cream/45">{u.email}</span></span>
                  <Badge tone={u.role === "OWNER" ? "fire" : "neutral"}>{u.role.toLowerCase()}</Badge>
                  <Badge tone={u.active ? "good" : "neutral"}>{u.active ? "active" : "disabled"}</Badge>
                  <span className="text-xs text-cream/35">last in {u.lastLoginAt?.toLocaleDateString() ?? "never"}</span>
                  {u.role !== "OWNER" && <ActionForm action={toggleTeamMember.bind(null, u.id)} submitLabel={u.active ? "Disable" : "Enable"} danger={u.active} inline />}
                </li>
              ))}
            </ul>
            <h3 className="type-annot mb-3 mt-6 text-cream/55">Add a team member</h3>
            <ActionForm action={addTeamMember} submitLabel="Create account">
              <div className="grid gap-3 md:grid-cols-2">
                <Field label="Name"><input name="name" className="admin-input" /></Field>
                <Field label="Email"><input name="email" type="email" className="admin-input" /></Field>
                <Field label="Role" hint="Managers edit the menu and settings; staff run orders, stock and reviews.">
                  <select name="role" className="admin-input"><option value="STAFF">Staff</option><option value="MANAGER">Manager</option></select>
                </Field>
                <Field label="Temporary password"><input name="password" type="text" minLength={10} className="admin-input" autoComplete="off" /></Field>
              </div>
            </ActionForm>
          </Card>
        ) : (
          <Card title="Staff accounts"><p className="text-sm text-cream/50">Only the owner can manage accounts.</p></Card>
        )}
      </div>
    </>
  );
}
