import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import AppLayout from "@/components/app/AppLayout";
import { Eyebrow } from "@/components/app/Common";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { ArrowRight, Plus, Edit, Trash2, Eye, Save, X, Loader2 } from "lucide-react";
import api from "@/lib/api";
import { toast } from "sonner";
import { usePageMeta } from "@/hooks/usePageMeta";

export default function BlogAdmin() {
  usePageMeta({ title: "Blog Admin — Goodly" });
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null);
  const [saving, setSaving] = useState(false);

  const [form, setForm] = useState({
    title: "", slug: "", excerpt: "", content: "", category: "SEO", tags: "", image_url: "", published: true,
  });

  useEffect(() => {
    fetchPosts();
  }, []);

  const fetchPosts = async () => {
    try {
      const { data } = await api.get("/blog/posts?limit=50");
      setPosts(data.posts || []);
    } catch (e) {
      toast.error("Failed to load posts");
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setForm({ title: "", slug: "", excerpt: "", content: "", category: "SEO", tags: "", image_url: "", published: true });
    setEditing(null);
  };

  const startEdit = (post) => {
    setEditing(post.id);
    setForm({
      title: post.title || "",
      slug: post.slug || "",
      excerpt: post.excerpt || "",
      content: post.content || "",
      category: post.category || "SEO",
      tags: (post.tags || []).join(", "),
      image_url: post.image_url || "",
      published: post.published !== false,
    });
  };

  const handleSave = async () => {
    if (!form.title || !form.slug || !form.content) {
      toast.error("Title, slug, and content are required");
      return;
    }
    setSaving(true);
    try {
      const payload = {
        ...form,
        tags: form.tags.split(",").map(t => t.trim()).filter(Boolean),
      };
      if (editing) {
        await api.put(`/blog/posts/${editing}`, payload);
        toast.success("Post updated");
      } else {
        await api.post("/blog/posts", payload);
        toast.success("Post created");
      }
      resetForm();
      fetchPosts();
    } catch (e) {
      toast.error(e?.response?.data?.detail || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (postId) => {
    if (!confirm("Delete this post?")) return;
    try {
      await api.delete(`/blog/posts/${postId}`);
      toast.success("Post deleted");
      fetchPosts();
    } catch (e) {
      toast.error("Delete failed");
    }
  };

  const generateSlug = () => {
    if (!form.title) return;
    const slug = form.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    setForm(f => ({ ...f, slug }));
  };

  return (
    <AppLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <Eyebrow>Blog Admin</Eyebrow>
            <h1 className="mt-2 font-display font-bold text-3xl text-[#1A201A]">Manage posts</h1>
          </div>
          <Button onClick={resetForm} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full px-5">
            <Plus size={16} className="mr-1" /> New post
          </Button>
        </div>

        {/* Editor */}
        <div className="bg-white border border-[#E5E0D8] rounded-2xl p-6 mb-8">
          <h2 className="font-display font-bold text-lg text-[#1A201A] mb-4">
            {editing ? "Edit post" : "New post"}
          </h2>
          <div className="grid gap-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="text-xs font-medium text-[#5C685C] mb-1 block">Title</label>
                <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} placeholder="Post title" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5C685C] mb-1 block">
                  Slug <button onClick={generateSlug} className="text-[#81B29A] hover:underline ml-2 text-[10px]">Generate</button>
                </label>
                <Input value={form.slug} onChange={e => setForm(f => ({ ...f, slug: e.target.value }))} placeholder="post-slug" />
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-[#5C685C] mb-1 block">Excerpt</label>
              <Textarea value={form.excerpt} onChange={e => setForm(f => ({ ...f, excerpt: e.target.value }))} placeholder="Brief summary" rows={2} />
            </div>
            <div>
              <label className="text-xs font-medium text-[#5C685C] mb-1 block">Content (Markdown)</label>
              <Textarea value={form.content} onChange={e => setForm(f => ({ ...f, content: e.target.value }))} placeholder="Post content..." rows={10} className="font-mono text-sm" />
            </div>
            <div className="grid md:grid-cols-3 gap-4">
              <div>
                <label className="text-xs font-medium text-[#5C685C] mb-1 block">Category</label>
                <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} placeholder="SEO" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5C685C] mb-1 block">Tags (comma-separated)</label>
                <Input value={form.tags} onChange={e => setForm(f => ({ ...f, tags: e.target.value }))} placeholder="seo, google, small business" />
              </div>
              <div>
                <label className="text-xs font-medium text-[#5C685C] mb-1 block">Image URL</label>
                <Input value={form.image_url} onChange={e => setForm(f => ({ ...f, image_url: e.target.value }))} placeholder="https://..." />
              </div>
            </div>
            <div className="flex items-center gap-4">
              <label className="flex items-center gap-2 text-sm text-[#5C685C]">
                <input type="checkbox" checked={form.published} onChange={e => setForm(f => ({ ...f, published: e.target.checked }))} />
                Published
              </label>
              <div className="flex gap-2 ml-auto">
                {editing && (
                  <Button variant="outline" onClick={resetForm} className="rounded-full">
                    <X size={16} className="mr-1" /> Cancel
                  </Button>
                )}
                <Button onClick={handleSave} disabled={saving} className="bg-[#2D3E32] hover:bg-[#4A5F4F] text-white rounded-full">
                  {saving ? <Loader2 className="animate-spin" size={16} /> : <Save size={16} className="mr-1" />}
                  {editing ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Post list */}
        {loading ? (
          <div className="text-[#5C685C]">Loading...</div>
        ) : (
          <div className="space-y-3">
            {posts.map(post => (
              <div key={post.id} className="bg-white border border-[#E5E0D8] rounded-xl p-4 flex items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="font-medium text-[#1A201A] truncate">{post.title}</div>
                  <div className="text-xs text-[#9CA89C] mt-0.5">
                    /blog/{post.slug} · {post.category} · {post.published !== false ? "Published" : "Draft"}
                  </div>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <Link to={`/blog/${post.slug}`} target="_blank" className="p-2 text-[#9CA89C] hover:text-[#1A201A] rounded-lg hover:bg-[#F3F0E9]">
                    <Eye size={16} />
                  </Link>
                  <button onClick={() => startEdit(post)} className="p-2 text-[#9CA89C] hover:text-[#1A201A] rounded-lg hover:bg-[#F3F0E9]">
                    <Edit size={16} />
                  </button>
                  <button onClick={() => handleDelete(post.id)} className="p-2 text-[#9CA89C] hover:text-red-500 rounded-lg hover:bg-red-50">
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>
            ))}
            {posts.length === 0 && (
              <div className="text-center py-12 text-[#5C685C]">No posts yet. Create your first one above.</div>
            )}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
