using UnityEngine;

namespace Werewolf.Player
{
    /// <summary>
    /// CameraControllerFPS: Điều khiển góc nhìn thứ nhất (First-Person Perspective) tại bàn cược Liar's Bar.
    /// Giới hạn góc quay tự nhiên quanh bàn, có hiệu ứng phập phồng thở và zoom khi ngắm bắn.
    /// </summary>
    public class CameraControllerFPS : MonoBehaviour
    {
        [Header("Mouse Look Sensitivity")]
        [SerializeField] private float mouseSensitivityX = 120f;
        [SerializeField] private float mouseSensitivityY = 100f;

        [Header("Rotation Clamping (Góc nhìn bị giới hạn quanh bàn)")]
        [SerializeField] private float minPitch = -35f; // Nhìn xuống bàn bài
        [SerializeField] private float maxPitch = 25f;  // Nhìn lên đèn chùm
        [SerializeField] private float minYaw = -75f;   // Nhìn sang người bên trái
        [SerializeField] private float maxYaw = 75f;    // Nhìn sang người bên phải

        [Header("Breathing Sway (Hiệu ứng thở phập phồng)")]
        [SerializeField] private float swaySpeed = 1.4f;
        [SerializeField] private float swayAmount = 0.015f;

        [Header("FOV & Zoom")]
        [SerializeField] private Camera playerCamera;
        [SerializeField] private float normalFOV = 60f;
        [SerializeField] private float aimFOV = 45f;
        [SerializeField] private float fovTransitionSpeed = 8f;

        private float currentYaw = 0f;
        private float currentPitch = 0f;
        private Vector3 initialLocalPos;
        private bool isAiming = false;

        private void Start()
        {
            if (playerCamera == null) playerCamera = GetComponent<Camera>();
            initialLocalPos = transform.localPosition;
            
            // Khóa chuột vào giữa màn hình khi chơi
            Cursor.lockState = CursorLockMode.Locked;
            Cursor.visible = false;
        }

        private void Update()
        {
            HandleMouseLook();
            HandleBreathingSway();
            HandleFOVZoom();

            // Nhấn ESC để hiện/ẩn con trỏ chuột
            if (Input.GetKeyDown(KeyCode.Escape))
            {
                Cursor.lockState = Cursor.lockState == CursorLockMode.Locked ? CursorLockMode.None : CursorLockMode.Locked;
                Cursor.visible = !Cursor.visible;
            }
        }

        private void HandleMouseLook()
        {
            if (Cursor.lockState != CursorLockMode.Locked) return;

            float mouseX = Input.GetAxis("Mouse X") * mouseSensitivityX * Time.deltaTime;
            float mouseY = Input.GetAxis("Mouse Y") * mouseSensitivityY * Time.deltaTime;

            currentYaw = Mathf.Clamp(currentYaw + mouseX, minYaw, maxYaw);
            currentPitch = Mathf.Clamp(currentPitch - mouseY, minPitch, maxPitch);

            transform.localRotation = Quaternion.Euler(currentPitch, currentYaw, 0f);
        }

        private void HandleBreathingSway()
        {
            float swayY = Mathf.Sin(Time.time * swaySpeed) * swayAmount;
            float swayX = Mathf.Cos(Time.time * swaySpeed * 0.5f) * (swayAmount * 0.5f);
            transform.localPosition = initialLocalPos + new Vector3(swayX, swayY, 0f);
        }

        private void HandleFOVZoom()
        {
            float targetFOV = isAiming ? aimFOV : normalFOV;
            playerCamera.fieldOfView = Mathf.Lerp(playerCamera.fieldOfView, targetFOV, Time.deltaTime * fovTransitionSpeed);
        }

        public void SetAiming(bool aiming)
        {
            isAiming = aiming;
        }
    }
}
