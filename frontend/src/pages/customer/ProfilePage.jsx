import { useEffect, useState } from "react";
import { UserRound, Mail, Phone, Save } from "lucide-react";

import { getProfile, updateProfile } from "../../services/profileService";

function ProfilePage() {
  const [profile, setProfile] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
  });

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const data = await getProfile();
        setProfile(data);
      } catch (err) {
        console.error("Failed to load profile:", err);
        setError("Unable to load profile information.");
      } finally {
        setLoading(false);
      }
    };

    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;

    setProfile((previous) => ({
      ...previous,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      setSaving(true);
      setError("");
      setMessage("");

      const updatedProfile = await updateProfile({
        first_name: profile.first_name,
        last_name: profile.last_name,
        phone: profile.phone,
      });

      setProfile(updatedProfile);
      setMessage("Profile updated successfully.");
    } catch (err) {
      console.error("Failed to update profile:", err);
      setError("Unable to update profile. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-gray-500">Loading profile...</div>
    );
  }

  return (
    <section className="max-w-3xl mx-auto px-4 py-12">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-6 sm:p-8">
        <div className="flex items-center gap-4 mb-8">
          <div className="bg-green-100 p-4 rounded-full">
            <UserRound size={32} className="text-green-700" />
          </div>

          <div>
            <h1 className="text-2xl font-bold text-gray-800">My Profile</h1>
            <p className="text-gray-500 text-sm">
              Manage your personal information
            </p>
          </div>
        </div>

        {error && (
          <p className="bg-red-50 text-red-600 p-3 rounded-lg mb-5">{error}</p>
        )}

        {message && (
          <p className="bg-green-50 text-green-700 p-3 rounded-lg mb-5">
            {message}
          </p>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                First Name
              </label>

              <input
                type="text"
                name="first_name"
                value={profile.first_name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                placeholder="First name"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Last Name
              </label>

              <input
                type="text"
                name="last_name"
                value={profile.last_name}
                onChange={handleChange}
                className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
                placeholder="Last name"
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Mail size={16} />
              Email Address
            </label>

            <input
              type="email"
              value={profile.email}
              readOnly
              className="w-full bg-gray-100 border border-gray-200 rounded-lg px-4 py-3 text-gray-500 cursor-not-allowed"
            />

            <p className="text-xs text-gray-400 mt-1">
              Email address cannot be changed here.
            </p>
          </div>

          <div>
            <label className="flex items-center gap-2 text-sm font-medium text-gray-700 mb-2">
              <Phone size={16} />
              Phone Number
            </label>

            <input
              type="tel"
              name="phone"
              value={profile.phone}
              onChange={handleChange}
              className="w-full border border-gray-200 rounded-lg px-4 py-3 outline-none focus:ring-2 focus:ring-green-500"
              placeholder="Phone number"
            />
          </div>

          <button
            type="submit"
            disabled={saving}
            className="w-full sm:w-auto bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition"
          >
            <Save size={18} />
            {saving ? "Saving..." : "Save Changes"}
          </button>
        </form>
      </div>
    </section>
  );
}

export default ProfilePage;
