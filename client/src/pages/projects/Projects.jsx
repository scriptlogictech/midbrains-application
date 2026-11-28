
import React, { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  createProject,
  getCompanyProjects,
  updateProject,
  deleteProject,
} from "../../services/projectService";
import { getCompanies } from "../../services/companyService";
import { useAuth } from "../../context/AuthContext";

const emptyForm = {
  projectName: "",
  projectCategory: "",
  projectDescription: "",
  projectOutcomes: "",
  projectUrl: "",
};

const styles = {
  page: {
    padding: "24px",
    color: "#1e293b",
    fontFamily: "inherit",
  },
  header: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    flexWrap: "wrap",
    gap: "16px",
    marginBottom: "24px",
  },
  title: {
    margin: 0,
    fontSize: "26px",
    fontWeight: 700,
  },
  subtitle: {
    color: "#64748b",
    marginTop: "6px",
    fontSize: "14px",
  },
  button: {
    border: "none",
    borderRadius: "8px",
    padding: "10px 16px",
    background: "#2563eb",
    color: "#fff",
    fontWeight: 600,
    cursor: "pointer",
  },
  secondaryButton: {
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    padding: "9px 14px",
    background: "#fff",
    color: "#334155",
    cursor: "pointer",
  },
  input: {
    width: "100%",
    padding: "11px 12px",
    border: "1px solid #cbd5e1",
    borderRadius: "8px",
    fontSize: "14px",
    boxSizing: "border-box",
    outline: "none",
  },
  label: {
    display: "block",
    fontSize: "13px",
    fontWeight: 600,
    marginBottom: "7px",
    color: "#334155",
  },
  card: {
    border: "1px solid #e2e8f0",
    borderRadius: "12px",
    overflow: "hidden",
    background: "#fff",
  },
};

const getArray = (response, key) => {
  if (Array.isArray(response)) return response;
  if (Array.isArray(response?.[key])) return response[key];
  if (Array.isArray(response?.data?.[key])) return response.data[key];
  if (Array.isArray(response?.data)) return response.data;
  return [];
};

const Projects = () => {
  const { user } = useAuth();
  const { companyId: routeCompanyId } = useParams();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === "super_admin";
  const isEmployee = user?.role === "employee";

  const userCompanyId =
    user?.company?._id || user?.company || routeCompanyId || "";

  const [companies, setCompanies] = useState([]);
  const [selectedCompany, setSelectedCompany] = useState(
    isSuperAdmin ? "" : userCompanyId
  );

  const [projects, setProjects] = useState([]);
  const [selectedCategory, setSelectedCategory] = useState("All");
  const [search, setSearch] = useState("");

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const [showForm, setShowForm] = useState(false);
  const [editingProject, setEditingProject] = useState(null);
  const [form, setForm] = useState(emptyForm);
  const [selectedFiles, setSelectedFiles] = useState([]);

  // Load companies for Super Admin
  useEffect(() => {
    if (!isSuperAdmin) return;

    const fetchCompanies = async () => {
      try {
        const response = await getCompanies();
        setCompanies(getArray(response, "companies"));
      } catch (err) {
        console.error("Failed to load companies:", err);
        setError("Unable to load companies.");
      }
    };

    fetchCompanies();
  }, [isSuperAdmin]);

  // Load projects for selected company
  useEffect(() => {
    const fetchProjects = async () => {
      if (!selectedCompany) {
        setProjects([]);
        setLoading(false);
        return;
      }

      try {
        setLoading(true);
        setError("");

        const response = await getCompanyProjects(selectedCompany);
        setProjects(getArray(response, "projects"));
      } catch (err) {
        console.error("Failed to load projects:", err);
        setError(
          err?.response?.data?.message || "Unable to load projects."
        );
      } finally {
        setLoading(false);
      }
    };

    fetchProjects();
  }, [selectedCompany]);

  // Categories are derived from project records.
  const categories = useMemo(() => {
    const values = projects
      .map((project) => project.projectCategory?.trim())
      .filter(Boolean);

    return ["All", ...new Set(values)];
  }, [projects]);

  const filteredProjects = useMemo(() => {
    return projects.filter((project) => {
      const matchesCategory =
        selectedCategory === "All" ||
        project.projectCategory === selectedCategory;

      const searchText = search.toLowerCase();

      const matchesSearch =
        project.projectName?.toLowerCase().includes(searchText) ||
        project.projectDescription?.toLowerCase().includes(searchText);

      return matchesCategory && matchesSearch;
    });
  }, [projects, selectedCategory, search]);

  const groupedProjects = useMemo(() => {
    return filteredProjects.reduce((groups, project) => {
      const category = project.projectCategory || "Uncategorized";

      if (!groups[category]) {
        groups[category] = [];
      }

      groups[category].push(project);
      return groups;
    }, {});
  }, [filteredProjects]);

  const openAddForm = () => {
    setEditingProject(null);
    setForm(emptyForm);
    setSelectedFiles([]);
    setError("");
    setShowForm(true);
  };

  const openEditForm = (project) => {
    setEditingProject(project);

    setForm({
      projectName: project.projectName || "",
      projectCategory: project.projectCategory || "",
      projectDescription: project.projectDescription || "",
      projectOutcomes: (project.projectOutcomes || []).join("\n"),
      projectUrl: project.projectUrl || "",
    });

    setSelectedFiles([]);
    setError("");
    setShowForm(true);
  };

  const closeForm = () => {
    selectedFiles.forEach((item) => URL.revokeObjectURL(item.preview));
    setSelectedFiles([]);
    setShowForm(false);
    setEditingProject(null);
    setForm(emptyForm);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files || []);
    const validFiles = files.filter((file) => file.type.startsWith("image/"));

    if (validFiles.length !== files.length) {
      setError("Please select image files only.");
    }

    const remainingSlots = Math.max(0, 10 - selectedFiles.length);

    if (validFiles.length > remainingSlots) {
      setError("You can upload a maximum of 10 screenshots per request.");
    }

    const filesToAdd = validFiles.slice(0, remainingSlots);
    const newFiles = filesToAdd.map((file) => ({
      file,
      preview: URL.createObjectURL(file),
    }));

    setSelectedFiles((previous) => [...previous, ...newFiles]);
    e.target.value = "";
  };

  const removeSelectedFile = (index) => {
    setSelectedFiles((previous) => {
      const item = previous[index];
      if (item?.preview) URL.revokeObjectURL(item.preview);
      return previous.filter((_, i) => i !== index);
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!selectedCompany) {
      setError("Please select a company.");
      return;
    }

    if (
      !form.projectName.trim() ||
      !form.projectCategory.trim() ||
      !form.projectDescription.trim()
    ) {
      setError("Please fill in all required fields.");
      return;
    }

    const projectData = new FormData();
    projectData.append("company", selectedCompany);
    projectData.append("projectName", form.projectName.trim());
    projectData.append("projectCategory", form.projectCategory.trim());
    projectData.append("projectDescription", form.projectDescription.trim());
    projectData.append(
      "projectOutcomes",
      JSON.stringify(
        form.projectOutcomes
          .split("\n")
          .map((item) => item.trim())
          .filter(Boolean)
      )
    );
    projectData.append("projectUrl", form.projectUrl.trim());

    selectedFiles.forEach((item) => {
      projectData.append("projectScreenshots", item.file);
    });

    try {
      setSaving(true);
      setError("");

      if (editingProject) {
        await updateProject(editingProject._id, projectData);
      } else {
        await createProject(projectData);
      }

      const response = await getCompanyProjects(selectedCompany);
      setProjects(getArray(response, "projects"));
      closeForm();
    } catch (err) {
      console.error("Failed to save project:", err);
      setError(
        err?.response?.data?.message || "Unable to save project."
      );
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (projectId) => {
    const confirmed = window.confirm(
      "Are you sure you want to delete this project?"
    );

    if (!confirmed) return;

    try {
      await deleteProject(projectId);
      setProjects((previous) =>
        previous.filter((project) => project._id !== projectId)
      );
    } catch (err) {
      console.error("Failed to delete project:", err);
      setError(
        err?.response?.data?.message || "Unable to delete project."
      );
    }
  };

  if (!isSuperAdmin && !isEmployee) {
    return (
      <div style={styles.page}>
        <h2>Access Denied</h2>
        <p>You do not have permission to view projects.</p>
      </div>
    );
  }

  return (
    <div style={styles.page}>
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Project Showcase</h1>
          <p style={styles.subtitle}>
            Explore projects and their outcomes.
          </p>
        </div>

        {isSuperAdmin && (
          <button style={styles.button} onClick={openAddForm}>
            + Add Project
          </button>
        )}
      </div>

      {error && (
        <div
          style={{
            background: "#fef2f2",
            color: "#b91c1c",
            padding: "12px 16px",
            borderRadius: "8px",
            marginBottom: "18px",
          }}
        >
          {error}
        </div>
      )}

      {isSuperAdmin && (
        <div style={{ maxWidth: "320px", marginBottom: "20px" }}>
          <label style={styles.label}>Select Company</label>
          <select
            style={styles.input}
            value={selectedCompany}
            onChange={(e) => {
              setSelectedCompany(e.target.value);
              setSelectedCategory("All");
            }}
          >
            <option value="">Select a company</option>
            {companies.map((company) => (
              <option key={company._id} value={company._id}>
                {company.companyName}
              </option>
            ))}
          </select>
        </div>
      )}

      {selectedCompany && (
        <>
          <div
            style={{
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              marginBottom: "22px",
              alignItems: "center",
            }}
          >
            <input
              style={{ ...styles.input, maxWidth: "320px" }}
              placeholder="Search projects..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />

            <select
              style={{ ...styles.input, maxWidth: "220px" }}
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
            >
              {categories.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </div>

          {loading ? (
            <p>Loading projects...</p>
          ) : filteredProjects.length === 0 ? (
            <div
              style={{
                textAlign: "center",
                padding: "55px 20px",
                border: "1px dashed #cbd5e1",
                borderRadius: "12px",
                background: "#f8fafc",
              }}
            >
              <h3>No projects found</h3>
              <p style={{ color: "#64748b" }}>
                {projects.length === 0
                  ? "No projects have been added for this company yet."
                  : "Try changing your search or category filter."}
              </p>
            </div>
          ) : (
            Object.entries(groupedProjects).map(([category, items]) => (
              <section key={category} style={{ marginBottom: "32px" }}>
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                    marginBottom: "15px",
                  }}
                >
                  <h2 style={{ fontSize: "19px", margin: 0 }}>
                    {category}
                  </h2>
                  <span style={{ color: "#64748b", fontSize: "13px" }}>
                    {items.length} {items.length === 1 ? "Project" : "Projects"}
                  </span>
                </div>

                <div
                  style={{
                    display: "grid",
                    gridTemplateColumns:
                      "repeat(auto-fill, minmax(260px, 1fr))",
                    gap: "18px",
                  }}
                >
                  {items.map((project) => (
                    <article key={project._id} style={styles.card}>
                      <div
                        style={{
                          height: "165px",
                          background: "#f1f5f9",
                          overflow: "hidden",
                        }}
                      >
                        {project.projectScreenshots?.[0] ? (
                          <img
                            src={project.projectScreenshots[0]}
                            alt={project.projectName}
                            style={{
                              width: "100%",
                              height: "100%",
                              objectFit: "cover",
                            }}
                          />
                        ) : (
                          <div
                            style={{
                              height: "100%",
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              color: "#94a3b8",
                              fontSize: "14px",
                            }}
                          >
                            No project image
                          </div>
                        )}
                      </div>

                      <div style={{ padding: "16px" }}>
                        <span
                          style={{
                            fontSize: "11px",
                            fontWeight: 700,
                            color: "#2563eb",
                            background: "#eff6ff",
                            padding: "5px 9px",
                            borderRadius: "20px",
                          }}
                        >
                          {project.projectCategory}
                        </span>

                        <h3
                          style={{
                            fontSize: "17px",
                            margin: "13px 0 8px",
                          }}
                        >
                          {project.projectName}
                        </h3>

                        <p
                          style={{
                            color: "#64748b",
                            fontSize: "13px",
                            lineHeight: 1.6,
                            margin: "0 0 16px",
                            minHeight: "42px",
                          }}
                        >
                          {project.projectDescription?.length > 100
                            ? `${project.projectDescription.slice(0, 100)}...`
                            : project.projectDescription}
                        </p>

                        <div
                          style={{
                            display: "flex",
                            justifyContent: "space-between",
                            alignItems: "center",
                            gap: "8px",
                            flexWrap: "wrap",
                          }}
                        >
                          <button
                            style={styles.secondaryButton}
                            onClick={() =>
                              navigate(`/projects/${project._id}`)
                            }
                          >
                            View Details →
                          </button>

                          {isSuperAdmin && (
                            <div style={{ display: "flex", gap: "8px" }}>
                              <button
                                style={styles.secondaryButton}
                                onClick={() => openEditForm(project)}
                              >
                                Edit
                              </button>
                              <button
                                style={{
                                  ...styles.secondaryButton,
                                  color: "#dc2626",
                                }}
                                onClick={() => handleDelete(project._id)}
                              >
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))
          )}
        </>
      )}

      {/* Add / Edit Project Form */}
      {showForm && (
        <div
          onClick={closeForm}
          style={{
            position: "fixed",
            inset: 0,
            background: "rgba(15, 23, 42, 0.55)",
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            padding: "20px",
            zIndex: 1000,
            overflowY: "auto",
          }}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#fff",
              borderRadius: "14px",
              width: "100%",
              maxWidth: "650px",
              padding: "24px",
              maxHeight: "90vh",
              overflowY: "auto",
            }}
          >
            <div
              style={{
                display: "flex",
                justifyContent: "space-between",
                alignItems: "center",
                marginBottom: "22px",
              }}
            >
              <h2 style={{ margin: 0, fontSize: "21px" }}>
                {editingProject ? "Edit Project" : "Add New Project"}
              </h2>
              <button
                onClick={closeForm}
                style={{
                  border: "none",
                  background: "transparent",
                  fontSize: "24px",
                  cursor: "pointer",
                }}
              >
                ×
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Project Name *</label>
                <input
                  style={styles.input}
                  name="projectName"
                  value={form.projectName}
                  onChange={handleChange}
                  placeholder="Enter project name"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Project Category *</label>
                <input
                  style={styles.input}
                  name="projectCategory"
                  value={form.projectCategory}
                  onChange={handleChange}
                  placeholder="e.g. Web Development, Data Analytics"
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Project Description *</label>
                <textarea
                  style={{ ...styles.input, minHeight: "100px" }}
                  name="projectDescription"
                  value={form.projectDescription}
                  onChange={handleChange}
                  placeholder="Describe the project..."
                  required
                />
              </div>

              <div style={{ marginBottom: "16px" }}>
                <label style={styles.label}>Project Outcomes</label>
                <textarea
                  style={{ ...styles.input, minHeight: "90px" }}
                  name="projectOutcomes"
                  value={form.projectOutcomes}
                  onChange={handleChange}
                  placeholder={"Enter one outcome per line"}
                />
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={styles.label}>Project Screenshots</label>
                <input
                  type="file"
                  accept="image/*"
                  multiple
                  onChange={handleFileChange}
                  style={styles.input}
                />
                <p style={{ fontSize: "12px", color: "#64748b", marginTop: "7px" }}>
                  Select up to 10 images per upload. Maximum 5 MB per image.
                </p>

                {editingProject?.projectScreenshots?.length > 0 && (
                  <>
                    <p style={{ ...styles.label, marginTop: "16px" }}>
                      Previously uploaded screenshots
                    </p>
                    <div style={{
                      display: "flex",
                      flexWrap: "wrap",
                      gap: "10px",
                      marginBottom: "15px",
                    }}>
                      {editingProject.projectScreenshots.map((image, index) => (
                        <img
                          key={`${image}-${index}`}
                          src={image}
                          alt={`Existing screenshot ${index + 1}`}
                          style={{
                            width: "100px",
                            height: "80px",
                            objectFit: "cover",
                            borderRadius: "8px",
                            border: "1px solid #e2e8f0",
                          }}
                        />
                      ))}
                    </div>
                  </>
                )}

                {selectedFiles.length > 0 && (
                  <>
                    <p style={{ ...styles.label, marginTop: "16px" }}>
                      Selected images ({selectedFiles.length})
                    </p>
                    <div style={{
                      display: "grid",
                      gridTemplateColumns: "repeat(auto-fill, minmax(100px, 1fr))",
                      gap: "12px",
                      marginTop: "10px",
                    }}>
                      {selectedFiles.map((item, index) => (
                        <div key={`${item.file.name}-${index}`} style={{ position: "relative" }}>
                          <img
                            src={item.preview}
                            alt={item.file.name}
                            style={{
                              width: "100%",
                              height: "90px",
                              objectFit: "cover",
                              borderRadius: "8px",
                            }}
                          />
                          <button
                            type="button"
                            onClick={() => removeSelectedFile(index)}
                            aria-label={`Remove ${item.file.name}`}
                            style={{
                              position: "absolute",
                              top: "4px",
                              right: "4px",
                              background: "#dc2626",
                              color: "#fff",
                              border: "none",
                              borderRadius: "50%",
                              width: "24px",
                              height: "24px",
                              cursor: "pointer",
                            }}
                          >
                            ×
                          </button>
                          <p style={{
                            fontSize: "11px",
                            overflow: "hidden",
                            textOverflow: "ellipsis",
                            whiteSpace: "nowrap",
                            margin: "5px 0 0",
                          }}>
                            {item.file.name}
                          </p>
                        </div>
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div style={{ marginBottom: "22px" }}>
                <label style={styles.label}>Project URL</label>
                <input
                  style={styles.input}
                  name="projectUrl"
                  value={form.projectUrl}
                  onChange={handleChange}
                  placeholder="https://example.com"
                />
              </div>

              <div
                style={{
                  display: "flex",
                  justifyContent: "flex-end",
                  gap: "10px",
                }}
              >
                <button
                  type="button"
                  style={styles.secondaryButton}
                  onClick={closeForm}
                  disabled={saving}
                >
                  Cancel
                </button>

                <button
                  type="submit"
                  style={styles.button}
                  disabled={saving}
                >
                  {saving
                    ? "Saving..."
                    : editingProject
                    ? "Update Project"
                    : "Create Project"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Projects;
