"use client";

import { useEffect, useState } from "react";
import ESARequestModal from "@/components/ESARequestModal";

type ESARequest = {
  id: string;
  created_at: string;
  parent_name: string;
  parent_email: string;
  student_name: string;
  student_grade: string;
  project_idea?: string;
  package_choice: string;
  package_price: string;
  invoice_status: string;
  invoice_number?: string;
};

export default function Page() {
  const [requests, setRequests] = useState<ESARequest[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("");
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("All");
  const [selectedRequest, setSelectedRequest] = useState<ESARequest | null>(
    null
  );
  const [resendingId, setResendingId] = useState("");

  const statusOptions = [
    "Pending ESA Submission",
    "Submitted",
    "Under Review",
    "Approved",
    "Funded",
    "Project Started",
    "Completed",
  ];

  const filteredRequests = requests.filter((request) => {
    const term = search.trim().toLowerCase();

    if (!term && statusFilter === "All") {
      return true;
    }

    const parent = String(request.parent_name || "").toLowerCase();
    const student = String(request.student_name || "").toLowerCase();
    const email = String(request.parent_email || "").toLowerCase();

    const matchesSearch =
      parent.includes(term) ||
      student.includes(term) ||
      email.includes(term);

    const matchesStatus =
      statusFilter === "All" ? true : request.invoice_status === statusFilter;

    return matchesSearch && matchesStatus;
  });

  const loadRequests = async () => {
    setLoading(true);

    try {
      const response = await fetch("/api/admin/esa");
      const data = await response.json();

      if (data.success) {
        setRequests(data.requests || []);
      }
    } catch (error) {
      console.error(error);
      setMessage("Unable to load requests.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadRequests();
  }, []);

  const updateStatus = async (id: string, invoiceStatus: string) => {
    setMessage("Updating...");

    try {
      const response = await fetch("/api/admin/esa/update-status", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
          invoiceStatus,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message);
      }

      setRequests((current) =>
        current.map((request) =>
          request.id === id
            ? {
                ...request,
                invoice_status: invoiceStatus,
              }
            : request
        )
      );

      setMessage(
"Status updated"
);

await fetch(
"/api/admin/esa/status-email",
{
method:"POST",
headers:{
"Content-Type":
"application/json"
},
body:JSON.stringify({
id,
invoiceStatus
})
}
);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to update");
    }
  };

  const resendInvoice = async (id: string) => {
    setResendingId(id);
    setMessage("Sending invoice...");

    try {
      const response = await fetch("/api/admin/esa/resend", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          id,
        }),
      });

      const data = await response.json();

      if (!response.ok || !data.success) {
        throw new Error(data.message || "Unable to resend invoice.");
      }

      setMessage("Invoice resent successfully.");
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "Unable to resend.");
    } finally {
      setResendingId("");
    }
  };

  return (
    <main className="min-h-screen bg-black text-white px-6 py-16">
      <div className="max-w-7xl mx-auto">
        <h1 className="text-4xl font-bold mb-6">ESA Requests Admin</h1>

        <p className="text-gray-400 mb-6">
          Manage WriteNowBooks ESA requests
        </p>

        {message && (
          <div className="mb-6 p-4 rounded-xl bg-blue-900 text-blue-200">
            {message}
          </div>
        )}

        <div className="flex gap-4 mb-6 flex-wrap">
          <input
            placeholder="Search parent, student, or email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg p-3 flex-1 min-w-[260px]"
          />

          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-gray-900 border border-gray-700 rounded-lg p-3"
          >
            <option value="All">All Statuses</option>

            {statusOptions.map((status) => (
              <option key={status} value={status} className="text-black">
                {status}
              </option>
            ))}
          </select>
        </div>

        {loading ? (
          <p>Loading...</p>
        ) : (
          <div className="overflow-auto border border-gray-700 rounded-xl">
            <table className="w-full">
              <thead className="bg-gray-900">
                <tr>
                  <th className="p-4">Date</th>
                  <th className="p-4">Parent</th>
                  <th className="p-4">Email</th>
                  <th className="p-4">Student</th>
                  <th className="p-4">Package</th>
                  <th className="p-4">Amount</th>
                  <th className="p-4">Status</th>
                  <th className="p-4">View</th>
                  <th className="p-4">Resend</th>
                </tr>
              </thead>

              <tbody>
                {filteredRequests.length > 0 ? (
                  filteredRequests.map((request) => (
                    <tr key={request.id} className="border-t border-gray-800">
                      <td className="p-4">
                        {new Date(request.created_at).toLocaleDateString()}
                      </td>

                      <td className="p-4">{request.parent_name}</td>

                      <td className="p-4">{request.parent_email}</td>

                      <td className="p-4">{request.student_name}</td>

                      <td className="p-4">{request.package_choice}</td>

                      <td className="p-4 text-green-300">
                        {request.package_price}
                      </td>

                      <td className="p-4">
                        <select
                          value={
                            request.invoice_status || "Pending ESA Submission"
                          }
                          onChange={(e) =>
                            updateStatus(request.id, e.target.value)
                          }
                          className="bg-gray-900 border border-gray-700 rounded-lg p-2"
                        >
                          {statusOptions.map((status) => (
                            <option
                              key={status}
                              value={status}
                              className="text-black"
                            >
                              {status}
                            </option>
                          ))}
                        </select>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => setSelectedRequest(request)}
                          className="bg-blue-600 px-4 py-2 rounded-lg font-bold"
                        >
                          View
                        </button>
                      </td>

                      <td className="p-4">
                        <button
                          onClick={() => resendInvoice(request.id)}
                          disabled={resendingId === request.id}
                          className="bg-green-600 px-4 py-2 rounded-lg font-bold disabled:opacity-60"
                        >
                          {resendingId === request.id ? "Sending..." : "Resend"}
                        </button>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td
                      colSpan={9}
                      className="p-6 text-center text-gray-500"
                    >
                      No ESA requests found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedRequest && (
        <ESARequestModal
          request={selectedRequest}
          onClose={() => setSelectedRequest(null)}
        />
      )}
    </main>
  );
}