using System.Collections;
using UnityEngine;
using Werewolf.Network;

namespace Werewolf.Player
{
    /// <summary>
    /// RevolverFPS: Quản lý khẩu súng lục ổ xoay góc nhìn thứ nhất (FPS).
    /// Hỗ trợ giơ/hạ súng [R], xoay ổ đạn, bóp cò giật lùi (recoil), tia lửa nòng (muzzle flash) và tiếng súng.
    /// </summary>
    public class RevolverFPS : MonoBehaviour
    {
        [Header("Weapon Transforms")]
        [SerializeField] private Transform weaponHolder;
        [SerializeField] private Vector3 hipPosition = new Vector3(0.25f, -0.35f, 0.5f);
        [SerializeField] private Vector3 aimPosition = new Vector3(0f, -0.15f, 0.4f);
        [SerializeField] private float adsTransitionSpeed = 10f;

        [Header("Recoil Kickback")]
        [SerializeField] private float recoilKickDistance = 0.08f;
        [SerializeField] private float recoilKickRotation = 15f;
        [SerializeField] private float recoilRecoverySpeed = 12f;

        [Header("VFX & SFX")]
        [SerializeField] private ParticleSystem muzzleFlash;
        [SerializeField] private AudioSource audioSource;
        [SerializeField] private AudioClip cockSound;
        [SerializeField] private AudioClip cylinderSpinSound;
        [SerializeField] private AudioClip gunshotSound;
        [SerializeField] private AudioClip dryFireClickSound;

        [Header("Raycast Target")]
        [SerializeField] private Camera fpsCamera;
        [SerializeField] private LayerMask targetLayer;

        private bool isAiming = false;
        private Vector3 currentRecoilPos;
        private Vector3 currentRecoilRot;
        private CameraControllerFPS cameraController;

        private void Start()
        {
            if (audioSource == null) audioSource = GetComponent<AudioSource>();
            cameraController = FindObjectOfType<CameraControllerFPS>();
        }

        private void Update()
        {
            HandleWeaponInput();
            HandleWeaponPosition();
        }

        private void HandleWeaponInput()
        {
            // Phím R: Giơ súng ngắm / Hạ súng
            if (Input.GetKeyDown(KeyCode.R))
            {
                isAiming = !isAiming;
                if (cameraController != null) cameraController.SetAiming(isAiming);
                PlaySound(cockSound);
            }

            // Chuột trái: Bóp cò súng
            if (isAiming && Input.GetMouseButtonDown(0))
            {
                FireRevolver();
            }

            // Phím F: Xoay ổ đạn cò súng Nga (Spin Chamber)
            if (Input.GetKeyDown(KeyCode.F))
            {
                PlaySound(cylinderSpinSound);
            }
        }

        private void HandleWeaponPosition()
        {
            Vector3 targetPos = isAiming ? aimPosition : hipPosition;
            
            // Hồi phục từ độ giật
            currentRecoilPos = Vector3.Lerp(currentRecoilPos, Vector3.zero, Time.deltaTime * recoilRecoverySpeed);
            currentRecoilRot = Vector3.Lerp(currentRecoilRot, Vector3.zero, Time.deltaTime * recoilRecoverySpeed);

            weaponHolder.localPosition = Vector3.Lerp(weaponHolder.localPosition, targetPos + currentRecoilPos, Time.deltaTime * adsTransitionSpeed);
            weaponHolder.localRotation = Quaternion.Euler(currentRecoilRot);
        }

        public void FireRevolver()
        {
            // Kiểm tra ngắm trúng ai
            Ray ray = fpsCamera.ViewportPointToRay(new Vector3(0.5f, 0.5f, 0f));
            string targetPlayerId = null;

            if (Physics.Raycast(ray, out RaycastHit hit, 15f, targetLayer))
            {
                var mobster = hit.collider.GetComponentInParent<Table.MobsterCharacter>();
                if (mobster != null)
                {
                    targetPlayerId = mobster.PlayerId;
                    Debug.Log($"<color=red>[Revolver] Bắn vào đối thủ: {mobster.Nickname}</color>");
                }
            }

            // Gửi event lên server Node.js
            SocketNetworkManager.Instance.SendPullTrigger(targetPlayerId);

            // Tạo giật súng (Recoil)
            currentRecoilPos = new Vector3(0f, 0f, -recoilKickDistance);
            currentRecoilRot = new Vector3(-recoilKickRotation, 0f, 0f);

            // Kích hoạt tia lửa nòng và tiếng nổ
            if (muzzleFlash != null) muzzleFlash.Play();
            PlaySound(gunshotSound);
        }

        private void PlaySound(AudioClip clip)
        {
            if (clip != null && audioSource != null)
            {
                audioSource.PlayOneShot(clip);
            }
        }
    }
}
