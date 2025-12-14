import { useNavigate } from "react-router-dom";
import TopBar from "../components/TopBar";
import RestaurantForm from "../components/RestaurantForm";
import { GROUP_ID } from "../firebase";
import { useAuth } from "../auth/useAuth";
import { createRestaurant } from "../services/restaurants";

export default function AddRestaurantPage() {
  const { user } = useAuth();
  const nav = useNavigate();

  async function onSubmit(form) {
    await createRestaurant({ groupId: GROUP_ID, user, data: form });
    nav("/dashboard", { replace: true });
  }

  return (
    <div className="page">
      <TopBar />

      <div className="content">
        <h2 className="page-title">Add restaurant</h2>

        <div className="panel">
          <RestaurantForm initial={null} submitLabel="Create" onSubmit={onSubmit} />
        </div>
      </div>
    </div>
  );
}
