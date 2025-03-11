import { useState, useEffect, useRef } from "react";
import DashboardLayout from "@/components/layout/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import {
  MessageSquare,
  Plus,
  Edit,
  Trash2,
  Send,
  Clock,
  Calendar,
} from "lucide-react";
import { format, formatDistanceToNow } from "date-fns";

interface Post {
  id: string;
  title: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
  updated_at: string;
  comments?: Comment[];
}

interface Comment {
  id: string;
  post_id: string;
  content: string;
  author_id: string;
  author_name: string;
  created_at: string;
}

export default function PostsPage() {
  const { user, hasPermission } = useAuth();
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [newPost, setNewPost] = useState<Partial<Post>>({
    title: "",
    content: "",
  });
  const [editingPost, setEditingPost] = useState<Post | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [newComment, setNewComment] = useState("");
  const [commentError, setCommentError] = useState("");
  const commentsEndRef = useRef<HTMLDivElement>(null);

  const canCreatePosts = hasPermission(["Leader", "Co-Leader", "Admin"]);

  useEffect(() => {
    fetchPosts();

    // Set up realtime subscription for posts and comments
    const postsSubscription = supabase
      .channel("posts_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "posts" },
        () => fetchPosts(),
      )
      .subscribe();

    const commentsSubscription = supabase
      .channel("post_comments_changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "post_comments" },
        () => {
          if (selectedPost) {
            fetchPostComments(selectedPost.id);
          }
        },
      )
      .subscribe();

    return () => {
      supabase.removeChannel(postsSubscription);
      supabase.removeChannel(commentsSubscription);
    };
  }, []);

  useEffect(() => {
    // Scroll to bottom of comments when new comments are added
    if (commentsEndRef.current) {
      commentsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedPost?.comments]);

  const fetchPosts = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from("posts")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;

      setPosts(data || []);

      // If a post was selected, update it with the latest data
      if (selectedPost) {
        const updatedPost = data?.find((p) => p.id === selectedPost.id);
        if (updatedPost) {
          await fetchPostComments(updatedPost.id);
        }
      }
    } catch (err) {
      console.error("Error fetching posts:", err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPostComments = async (postId: string) => {
    try {
      const { data, error } = await supabase
        .from("post_comments")
        .select("*")
        .eq("post_id", postId)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Update the selected post with comments
      setSelectedPost((prev) => {
        if (!prev) return null;
        return { ...prev, comments: data || [] };
      });

      // Also update the post in the posts array
      setPosts((prevPosts) =>
        prevPosts.map((post) =>
          post.id === postId ? { ...post, comments: data || [] } : post,
        ),
      );
    } catch (err) {
      console.error("Error fetching comments:", err);
    }
  };

  const handleAddPost = async () => {
    if (!newPost.title || !newPost.content || !user || !canCreatePosts) return;

    try {
      const { data, error } = await supabase
        .from("posts")
        .insert([
          {
            title: newPost.title,
            content: newPost.content,
            author_id: user.id,
            author_name: user.displayName,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        setPosts([data[0], ...posts]);
        setSelectedPost({ ...data[0], comments: [] });
      }

      // Reset form
      setNewPost({
        title: "",
        content: "",
      });
      setIsAddDialogOpen(false);
    } catch (err) {
      console.error("Error adding post:", err);
    }
  };

  const handleEditPost = async () => {
    if (!editingPost || !user) return;

    // Only author can edit post
    if (editingPost.author_id !== user.id && !hasPermission(["Admin"])) return;

    try {
      const { error } = await supabase
        .from("posts")
        .update({
          title: editingPost.title,
          content: editingPost.content,
        })
        .eq("id", editingPost.id);

      if (error) throw error;

      // Update local state
      setPosts(
        posts.map((post) =>
          post.id === editingPost.id
            ? {
                ...post,
                title: editingPost.title,
                content: editingPost.content,
                updated_at: new Date().toISOString(),
              }
            : post,
        ),
      );

      if (selectedPost?.id === editingPost.id) {
        setSelectedPost({
          ...selectedPost,
          title: editingPost.title,
          content: editingPost.content,
          updated_at: new Date().toISOString(),
        });
      }

      setEditingPost(null);
      setIsEditDialogOpen(false);
    } catch (err) {
      console.error("Error updating post:", err);
    }
  };

  const handleDeletePost = async (id: string) => {
    if (!user) return;

    const post = posts.find((p) => p.id === id);
    if (!post) return;

    // Only author or admin can delete post
    if (post.author_id !== user.id && !hasPermission(["Admin"])) return;

    if (!confirm("Are you sure you want to delete this post?")) return;

    try {
      const { error } = await supabase.from("posts").delete().eq("id", id);

      if (error) throw error;

      // Update local state
      setPosts(posts.filter((post) => post.id !== id));
      if (selectedPost?.id === id) {
        setSelectedPost(null);
      }
    } catch (err) {
      console.error("Error deleting post:", err);
    }
  };

  const handleAddComment = async () => {
    if (!newComment.trim() || !selectedPost || !user) {
      setCommentError("Please enter a comment");
      return;
    }

    try {
      setCommentError("");
      const { data, error } = await supabase
        .from("post_comments")
        .insert([
          {
            post_id: selectedPost.id,
            content: newComment,
            author_id: user.id,
            author_name: user.displayName,
          },
        ])
        .select();

      if (error) throw error;

      if (data && data[0]) {
        // Add comment to selected post
        setSelectedPost({
          ...selectedPost,
          comments: [...(selectedPost.comments || []), data[0]],
        });

        // Also update the post in the posts array
        setPosts(
          posts.map((post) =>
            post.id === selectedPost.id
              ? {
                  ...post,
                  comments: [...(post.comments || []), data[0]],
                }
              : post,
          ),
        );
      }

      // Reset comment input
      setNewComment("");
    } catch (err) {
      console.error("Error adding comment:", err);
      setCommentError("Failed to add comment. Please try again.");
    }
  };

  const handleDeleteComment = async (commentId: string) => {
    if (!user || !selectedPost) return;

    const comment = selectedPost.comments?.find((c) => c.id === commentId);
    if (!comment) return;

    // Only author or admin can delete comment
    if (comment.author_id !== user.id && !hasPermission(["Admin"])) return;

    if (!confirm("Are you sure you want to delete this comment?")) return;

    try {
      const { error } = await supabase
        .from("post_comments")
        .delete()
        .eq("id", commentId);

      if (error) throw error;

      // Update selected post
      setSelectedPost({
        ...selectedPost,
        comments:
          selectedPost.comments?.filter((c) => c.id !== commentId) || [],
      });

      // Also update the post in the posts array
      setPosts(
        posts.map((post) =>
          post.id === selectedPost.id
            ? {
                ...post,
                comments:
                  post.comments?.filter((c) => c.id !== commentId) || [],
              }
            : post,
        ),
      );
    } catch (err) {
      console.error("Error deleting comment:", err);
    }
  };

  const startEditPost = (post: Post) => {
    if (!user) return;

    // Only author or admin can edit post
    if (post.author_id !== user.id && !hasPermission(["Admin"])) return;

    setEditingPost({ ...post });
    setIsEditDialogOpen(true);
  };

  const selectPost = async (post: Post) => {
    // If post doesn't have comments yet, fetch them
    if (!post.comments) {
      await fetchPostComments(post.id);
    } else {
      setSelectedPost(post);
    }
  };

  const formatDate = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return format(date, "MMM d, yyyy 'at' h:mm a");
    } catch (e) {
      return dateString;
    }
  };

  const formatRelativeTime = (dateString: string) => {
    try {
      const date = new Date(dateString);
      return formatDistanceToNow(date, { addSuffix: true });
    } catch (e) {
      return "some time ago";
    }
  };

  if (loading) {
    return (
      <DashboardLayout activeTab="posts">
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout activeTab="posts">
      <div className="space-y-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Class Posts</h1>
            <p className="text-muted-foreground">
              {canCreatePosts
                ? "Create and manage announcements for your class."
                : "View announcements and updates from your class leaders."}
            </p>
          </div>

          {canCreatePosts && (
            <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" /> New Post
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Create New Post</DialogTitle>
                  <DialogDescription>
                    Share an announcement or update with your class.
                  </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="postTitle">Title</Label>
                    <Input
                      id="postTitle"
                      placeholder="Post title"
                      value={newPost.title}
                      onChange={(e) =>
                        setNewPost({ ...newPost, title: e.target.value })
                      }
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="postContent">Content</Label>
                    <Textarea
                      id="postContent"
                      placeholder="Write your post content here..."
                      value={newPost.content}
                      onChange={(e) =>
                        setNewPost({ ...newPost, content: e.target.value })
                      }
                      rows={6}
                    />
                  </div>
                </div>

                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setIsAddDialogOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAddPost}
                    disabled={!newPost.title || !newPost.content}
                  >
                    Post
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="md:col-span-1 space-y-4">
            <div className="font-medium text-lg flex items-center">
              <MessageSquare className="mr-2 h-5 w-5" /> Recent Posts
            </div>
            {posts.length === 0 ? (
              <Card>
                <CardContent className="p-6 text-center text-muted-foreground">
                  No posts yet
                  {canCreatePosts && (
                    <div className="mt-4">
                      <Button onClick={() => setIsAddDialogOpen(true)}>
                        <Plus className="mr-2 h-4 w-4" /> Create First Post
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-2">
                {posts.map((post) => (
                  <Card
                    key={post.id}
                    className={`cursor-pointer hover:border-primary transition-colors ${selectedPost?.id === post.id ? "border-primary" : ""}`}
                    onClick={() => selectPost(post)}
                  >
                    <CardHeader className="p-4 pb-2">
                      <div className="flex justify-between items-start">
                        <CardTitle className="text-lg">{post.title}</CardTitle>
                        {user &&
                          (post.author_id === user.id ||
                            hasPermission(["Admin"])) && (
                            <div className="flex space-x-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  startEditPost(post);
                                }}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="text-destructive"
                                onClick={(e) => {
                                  e.stopPropagation();
                                  handleDeletePost(post.id);
                                }}
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          )}
                      </div>
                    </CardHeader>
                    <CardContent className="p-4 pt-0">
                      <div className="flex items-center text-sm text-muted-foreground">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${post.author_name}`}
                          />
                          <AvatarFallback>
                            {post.author_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span>{post.author_name}</span>
                      </div>
                      <div className="flex items-center text-xs text-muted-foreground mt-1">
                        <Clock className="h-3 w-3 mr-1" />
                        <span>{formatRelativeTime(post.created_at)}</span>
                      </div>
                      <div className="flex items-center text-sm mt-2">
                        <MessageSquare className="h-4 w-4 mr-1 text-muted-foreground" />
                        <span>
                          {post.comments?.length || 0}{" "}
                          {post.comments?.length === 1 ? "comment" : "comments"}
                        </span>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>

          <div className="md:col-span-2">
            {selectedPost ? (
              <Card className="h-full flex flex-col">
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="text-xl">
                        {selectedPost.title}
                      </CardTitle>
                      <CardDescription className="flex items-center mt-1">
                        <Avatar className="h-5 w-5 mr-1">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${selectedPost.author_name}`}
                          />
                          <AvatarFallback>
                            {selectedPost.author_name.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <span className="mr-2">{selectedPost.author_name}</span>
                        <Calendar className="h-3 w-3 mr-1" />
                        <span>{formatDate(selectedPost.created_at)}</span>
                      </CardDescription>
                    </div>
                    {user &&
                      (selectedPost.author_id === user.id ||
                        hasPermission(["Admin"])) && (
                        <div className="flex space-x-1">
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => startEditPost(selectedPost)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            className="text-destructive"
                            onClick={() => handleDeletePost(selectedPost.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                  </div>
                </CardHeader>
                <CardContent className="flex-grow overflow-auto">
                  <div className="prose max-w-none">
                    <p className="whitespace-pre-wrap">
                      {selectedPost.content}
                    </p>
                  </div>

                  <Separator className="my-6" />

                  <div className="space-y-4">
                    <h3 className="text-lg font-medium flex items-center">
                      <MessageSquare className="h-5 w-5 mr-2" /> Comments
                      {selectedPost.comments &&
                        selectedPost.comments.length > 0 && (
                          <Badge variant="secondary" className="ml-2">
                            {selectedPost.comments.length}
                          </Badge>
                        )}
                    </h3>

                    <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2">
                      {!selectedPost.comments ||
                      selectedPost.comments.length === 0 ? (
                        <div className="text-center text-muted-foreground py-8">
                          No comments yet. Be the first to comment!
                        </div>
                      ) : (
                        <div className="space-y-4">
                          {selectedPost.comments.map((comment) => (
                            <div
                              key={comment.id}
                              className="flex space-x-3 p-3 rounded-lg bg-muted/30"
                            >
                              <Avatar className="h-8 w-8">
                                <AvatarImage
                                  src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${comment.author_name}`}
                                />
                                <AvatarFallback>
                                  {comment.author_name.charAt(0)}
                                </AvatarFallback>
                              </Avatar>
                              <div className="flex-1">
                                <div className="flex justify-between items-start">
                                  <div>
                                    <div className="font-medium">
                                      {comment.author_name}
                                    </div>
                                    <div className="text-xs text-muted-foreground">
                                      {formatRelativeTime(comment.created_at)}
                                    </div>
                                  </div>
                                  {user &&
                                    (comment.author_id === user.id ||
                                      hasPermission(["Admin"])) && (
                                      <Button
                                        variant="ghost"
                                        size="icon"
                                        className="h-6 w-6 text-destructive"
                                        onClick={() =>
                                          handleDeleteComment(comment.id)
                                        }
                                      >
                                        <Trash2 className="h-3 w-3" />
                                      </Button>
                                    )}
                                </div>
                                <p className="mt-1 text-sm whitespace-pre-wrap">
                                  {comment.content}
                                </p>
                              </div>
                            </div>
                          ))}
                          <div ref={commentsEndRef} />
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="border-t p-4">
                  {user ? (
                    <div className="w-full space-y-2">
                      <div className="flex items-center space-x-2">
                        <Avatar className="h-8 w-8">
                          <AvatarImage
                            src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${user.displayName}`}
                          />
                          <AvatarFallback>
                            {user.displayName.charAt(0)}
                          </AvatarFallback>
                        </Avatar>
                        <div className="flex-1 relative">
                          <Input
                            placeholder="Write a comment..."
                            value={newComment}
                            onChange={(e) => setNewComment(e.target.value)}
                            onKeyDown={(e) => {
                              if (e.key === "Enter" && !e.shiftKey) {
                                e.preventDefault();
                                handleAddComment();
                              }
                            }}
                            className="pr-10"
                          />
                          <Button
                            size="icon"
                            variant="ghost"
                            className="absolute right-1 top-1/2 transform -translate-y-1/2 h-8 w-8"
                            onClick={handleAddComment}
                            disabled={!newComment.trim()}
                          >
                            <Send className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                      {commentError && (
                        <p className="text-sm text-destructive">
                          {commentError}
                        </p>
                      )}
                    </div>
                  ) : (
                    <div className="w-full text-center text-muted-foreground">
                      Please sign in to comment
                    </div>
                  )}
                </CardFooter>
              </Card>
            ) : (
              <Card className="h-full">
                <CardContent className="p-6 text-center text-muted-foreground flex flex-col items-center justify-center h-full">
                  <MessageSquare className="h-12 w-12 mb-4 text-muted-foreground/50" />
                  <h3 className="text-lg font-medium mb-2">
                    Select a post to view details
                  </h3>
                  <p className="mb-4">
                    Click on a post from the list to view its content and
                    comments
                  </p>
                  {canCreatePosts && posts.length === 0 && (
                    <Button onClick={() => setIsAddDialogOpen(true)}>
                      <Plus className="mr-2 h-4 w-4" /> Create First Post
                    </Button>
                  )}
                </CardContent>
              </Card>
            )}
          </div>
        </div>

        {/* Edit Post Dialog */}
        {editingPost && (
          <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Post</DialogTitle>
                <DialogDescription>Update your post content.</DialogDescription>
              </DialogHeader>

              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <Label htmlFor="edit-postTitle">Title</Label>
                  <Input
                    id="edit-postTitle"
                    value={editingPost.title}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        title: e.target.value,
                      })
                    }
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="edit-postContent">Content</Label>
                  <Textarea
                    id="edit-postContent"
                    value={editingPost.content}
                    onChange={(e) =>
                      setEditingPost({
                        ...editingPost,
                        content: e.target.value,
                      })
                    }
                    rows={6}
                  />
                </div>
              </div>

              <DialogFooter>
                <Button
                  variant="outline"
                  onClick={() => setIsEditDialogOpen(false)}
                >
                  Cancel
                </Button>
                <Button
                  onClick={handleEditPost}
                  disabled={!editingPost.title || !editingPost.content}
                >
                  Save Changes
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        )}
      </div>
    </DashboardLayout>
  );
}
