#!/usr/bin/env python3
"""
Manual test script for privilege handling functionality.
This script tests the privilege checking without running the full application.
"""

import sys
import os

# Add backend directory to path
sys.path.insert(0, os.path.dirname(__file__))

from privileges import (
    PrivilegeManager,
    check_packet_capture_privileges,
    get_privilege_status,
    get_setup_instructions
)


def test_privilege_detection():
    """Test privilege detection on the current system."""
    print("🔍 Testing Privilege Detection")
    print("=" * 50)
    
    # Test privilege manager
    manager = PrivilegeManager()
    print(f"Platform: {manager.platform.value}")
    print(f"Privilege Level: {manager.privilege_level.value}")
    print(f"Has Privileges: {manager.has_packet_capture_privileges()}")
    print()
    
    # Test module functions
    has_privileges = check_packet_capture_privileges()
    print(f"check_packet_capture_privileges(): {has_privileges}")
    
    status = get_privilege_status()
    print(f"Platform from status: {status['platform']}")
    print(f"User ID: {status['user_id']}")
    print(f"Effective User ID: {status['effective_user_id']}")
    print(f"Is Root: {status['is_root']}")
    print(f"SUDO_USER: {status.get('sudo_user', 'None')}")
    print()
    
    # Test error messages and suggestions
    if not has_privileges:
        print("❌ Insufficient Privileges Detected")
        print("-" * 30)
        
        error_msg = manager.get_privilege_error_message()
        print(f"Error Message: {error_msg}")
        print()
        
        suggestions = manager.get_privilege_suggestions()
        print("Suggestions:")
        for i, suggestion in enumerate(suggestions, 1):
            print(f"  {i}. {suggestion}")
        print()
    else:
        print("✅ Sufficient Privileges Detected")
        print()
    
    # Test setup instructions
    instructions = get_setup_instructions()
    print("📋 Setup Instructions")
    print("-" * 20)
    print(f"Platform: {instructions['platform']}")
    print(f"Has Privileges: {instructions['has_privileges']}")
    
    if instructions['quick_start']:
        print("\nQuick Start:")
        for step in instructions['quick_start']:
            print(f"  {step}")
    
    if not instructions['has_privileges'] and instructions['suggestions']:
        print(f"\nTop Suggestions:")
        for suggestion in instructions['suggestions'][:3]:
            print(f"  • {suggestion}")
    
    print()


def test_packet_capture_simulation():
    """Test packet capture privilege checking without actually capturing."""
    print("📡 Testing Packet Capture Simulation")
    print("=" * 50)
    
    try:
        from capture import PacketStreamer
        
        streamer = PacketStreamer()
        print(f"PacketStreamer created successfully")
        
        # Test getting interfaces (should work without privileges)
        interfaces = PacketStreamer.get_interfaces()
        print(f"Available interfaces: {interfaces}")
        
        # Test privilege checking in start method
        print("\nTesting start() method privilege checking...")
        result = streamer.start()
        
        if result:
            print("✅ PacketStreamer started successfully")
            print(f"Is running: {streamer.is_running}")
            print(f"Current interface: {streamer.current_interface}")
            
            # Stop the streamer
            streamer.stop()
            print("PacketStreamer stopped")
        else:
            print("❌ PacketStreamer failed to start (likely due to privileges)")
            print(f"Is running: {streamer.is_running}")
        
    except Exception as e:
        print(f"Error testing PacketStreamer: {e}")
    
    print()


def test_platform_specific_behavior():
    """Test platform-specific behavior."""
    print("🖥️  Testing Platform-Specific Behavior")
    print("=" * 50)
    
    manager = PrivilegeManager()
    
    if manager.platform.value == 'linux':
        print("Linux-specific tests:")
        
        # Test capability checking
        has_caps = manager._check_linux_capabilities()
        print(f"  Linux capabilities detected: {has_caps}")
        
        # Test capability setup (dry run)
        print("  Testing capability setup (simulation)...")
        try:
            success, message = manager.setup_linux_capabilities('/usr/bin/python3')
            print(f"  Setup result: {success}")
            print(f"  Message: {message}")
        except Exception as e:
            print(f"  Setup error: {e}")
    
    elif manager.platform.value == 'darwin':
        print("macOS-specific tests:")
        print("  macOS requires sudo for packet capture")
        print("  No capability-based permissions available")
    
    elif manager.platform.value == 'windows':
        print("Windows-specific tests:")
        print("  Windows requires Administrator privileges")
        print("  Npcap installation required for packet capture")
    
    else:
        print(f"Unknown platform: {manager.platform.value}")
    
    print()


def main():
    """Run all privilege tests."""
    print("🧪 Wireshark+ Web - Privilege Handling Tests")
    print("=" * 60)
    print()
    
    test_privilege_detection()
    test_packet_capture_simulation()
    test_platform_specific_behavior()
    
    print("✅ All tests completed!")
    print()
    print("💡 Next steps:")
    print("  1. If privileges are insufficient, follow the suggestions above")
    print("  2. Run 'make setup-capabilities' on Linux for automated setup")
    print("  3. Use 'sudo make start-demo' if capabilities are not available")
    print("  4. Check the /privileges API endpoint when the server is running")


if __name__ == '__main__':
    main()