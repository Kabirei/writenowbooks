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
  invoice_number?: string;
  invoice_status: string;
};

export default function ESARequestModal({
  request,
  onClose,
}: {
  request: ESARequest;
  onClose: () => void;
}) {
  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 px-6">
      <div className="bg-gray-950 border border-gray-700 rounded-2xl p-8 max-w-2xl w-full text-white">
        <h2 className="text-3xl font-bold mb-6">ESA Request Details</h2>

        <div className="space-y-3 text-gray-300">
          <p><strong>Parent:</strong> {request.parent_name}</p>
          <p><strong>Email:</strong> {request.parent_email}</p>
          <p><strong>Student:</strong> {request.student_name}</p>
          <p><strong>Grade:</strong> {request.student_grade}</p>
          <p><strong>Package:</strong> {request.package_choice}</p>
          <p><strong>Amount:</strong> {request.package_price}</p>
          <p><strong>Status:</strong> {request.invoice_status}</p>
          <p><strong>Invoice #:</strong> {request.invoice_number || "Not assigned"}</p>
          <p><strong>Submitted:</strong> {new Date(request.created_at).toLocaleString()}</p>

          <div className="pt-4">
            <p className="font-bold text-white mb-2">Book Project Idea</p>
            <p className="bg-gray-900 border border-gray-700 rounded-xl p-4">
              {request.project_idea || "No project idea provided."}
            </p>
          </div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 bg-yellow-400 text-black px-6 py-3 rounded-xl font-bold"
        >
          Close
        </button>
      </div>
    </div>
  );
}